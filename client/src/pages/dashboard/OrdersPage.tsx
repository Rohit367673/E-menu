import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  ShoppingBag,
  ChefHat,
  CheckCircle2,
  Volume2,
  VolumeX,
  RefreshCw,
  Receipt,
  BellRing,
  Printer,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/client';
import type { Order, OrderStatus, OrderDashboardStats, PrintJob } from '../../types/menu';
import { playOrderNotificationSound } from '../../utils/sound';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useSearchParams } from 'react-router-dom';
import ManualOrderModal from '../../components/admin/ManualOrderModal';
import BillReceiptModal from '../../components/common/BillReceiptModal';
import KOTTicketModal from '../../components/admin/KOTTicketModal';
import {
  checkBridgeHealth,
  isWebSerialConnected,
  autoReconnectWebSerial,
  connectWebSerialPrinter,
  queueKOTPrint,
  requestScreenWakeLock,
  releaseScreenWakeLock,
} from '../../services/printBridge';

const cleanTableNumber = (raw: string): string => {
  if (!raw) return '';
  return raw.replace(/^table\s*/i, '').trim() || raw;
};

export default function OrdersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role !== 'manager';
  const [searchParams] = useSearchParams();

  const [orders, setOrders] = useState<Order[]>([]);
  const [, setStats] = useState<OrderDashboardStats>({
    pendingCount: 0,
    preparingCount: 0,
    servedCount: 0,
    activeCount: 0,
    todayOrdersCount: 0,
    todaySales: null,
    monthlySales: null,
  });
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'bill'>('all');
  const [tableFilter, setTableFilter] = useState<string>(searchParams.get('table') || 'all');
  const [viewMode, setViewMode] = useState<'grouped' | 'feed'>('grouped');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBridgeOnline, setIsBridgeOnline] = useState(false);

  // Live order counts directly from local state for instant responsiveness
  const todayTotalOrdersCount = orders.length;

  const liveActiveTablesCount = useMemo(() => {
    return new Set(orders.map((o) => cleanTableNumber(o.tableNumber))).size;
  }, [orders]);

  const liveKOTPrintedCount = useMemo(() => {
    return orders.filter((o) => o.kotNumber).length;
  }, [orders]);

  const todayTotalRevenue = useMemo(() => {
    return orders.reduce((sum, o) => {
      const orderTotal = (o.totalAmount && o.totalAmount > 0)
        ? o.totalAmount
        : o.items.reduce((s, it) => s + (it.price * it.quantity), 0);
      return sum + orderTotal;
    }, 0);
  }, [orders]);

  const pendingPrintCount = useMemo(() => {
    return orders.filter(
      (o) =>
        o.kotNumber &&
        (o.kotPrintStatus === 'PENDING' || o.kotPrintStatus === 'FAILED' || !o.kotPrintStatus)
    ).length;
  }, [orders]);

  // Manual Walk-in POS state
  const [isPosOpen, setIsPosOpen] = useState(false);
  const [posTable, setPosTable] = useState('Table 1');

  // Bill Receipt modal state
  const [receiptModal, setReceiptModal] = useState<{
    isOpen: boolean;
    tableNumber: string;
    customerName: string;
    orders: Order[];
    totalBill: number;
    isSettled: boolean;
  }>({
    isOpen: false,
    tableNumber: '',
    customerName: '',
    orders: [],
    totalBill: 0,
    isSettled: false,
  });

  // KOT Ticket modal state
  const [kotModal, setKotModal] = useState<{
    isOpen: boolean;
    orderId?: string;
    kotNumber: string;
    tableNumber: string;
    round: number;
    orderNumber: string;
    customerName: string;
    time: string;
    items: Array<{ name: string; quantity: number; notes?: string }>;
    specialInstructions: string;
    autoPrint: boolean;
    isReprint: boolean;
  }>({
    isOpen: false,
    orderId: '',
    kotNumber: '',
    tableNumber: '',
    round: 1,
    orderNumber: '',
    customerName: '',
    time: '',
    items: [],
    specialInstructions: '',
    autoPrint: false,
    isReprint: false,
  });

  const tabClientIdRef = useRef('pos-' + Math.random().toString(36).substring(2, 9));
  const isProcessingQueueRef = useRef(false);
  const seenKOTsRef = useRef<Set<string>>(new Set());
  const isInitializedRef = useRef(false);

  const [isSerialConnected, setIsSerialConnected] = useState(isWebSerialConnected());

  // Mutex-locked Sequential Print Queue Processor (FIFO, Atomic Claim on Server)
  const processPendingKOTQueue = useCallback(async (ordersList?: Order[]) => {
    if (isProcessingQueueRef.current) return;

    const autoPrintKOT = localStorage.getItem('sukoon_auto_print_kot') !== 'false';
    if (!autoPrintKOT) return;

    const sourceOrders = ordersList || orders;
    // Find active orders with pending or failed KOT print jobs (FIFO order by creation time)
    const pendingOrders = sourceOrders
      .filter(
        (o) =>
          o.kotNumber &&
          (o.kotPrintStatus === 'PENDING' || o.kotPrintStatus === 'FAILED' || !o.kotPrintStatus) &&
          (o.status === 'pending' || o.status === 'preparing')
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (pendingOrders.length === 0) return;

    const isPrinterReady = isWebSerialConnected() || isBridgeOnline;
    if (!isPrinterReady) {
      // If modal is currently open, wait until user finishes current ticket
      if (kotModal.isOpen) return;

      // DUAL PIPELINE: If Web Serial is not active (e.g. printer driver is in use via OS/Chrome print),
      // automatically pop the KOT print modal for the newest pending order!
      const nextPending = pendingOrders.find((o) => !seenKOTsRef.current.has(o._id));
      if (nextPending) {
        seenKOTsRef.current.add(nextPending._id);
        handleOpenKOT(nextPending, true, false);
      }
      return;
    }

    isProcessingQueueRef.current = true;

    try {
      for (const order of pendingOrders) {
        // Step 1: Atomic Claim on server (eliminates multi-tab double-print race conditions)
        try {
          const claimRes = await apiClient.post<{ success: boolean; data?: Order; alreadyClaimed?: boolean }>(
            `/orders/admin/kot/${order._id}/claim`,
            { printingBy: tabClientIdRef.current }
          );
          if (!claimRes.data.success) {
            // Already claimed by another active tab/session
            continue;
          }
        } catch {
          // Conflict (409) or network issue, safely skip
          continue;
        }

        // Step 2: Build PrintJob
        const time = order.createdAt
          ? new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          : new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        const printJob: PrintJob = {
          printJobId: order.kotPrintJobId || `PJ-${order.orderNumber}`,
          orderId: order._id,
          kotNumber: order.kotNumber || `KOT-${order.orderNumber}`,
          tableNumber: order.tableNumber,
          round: order.round,
          customerName: order.customerName,
          time,
          items: order.items.map((it) => ({ name: it.name, quantity: it.quantity, notes: it.notes })),
          specialInstructions: order.specialInstructions || '',
          isReprint: false,
        };

        // Step 3: Enqueue in Mutex FIFO Queue (Sequentially written to TVS thermal printer)
        const printRes = await queueKOTPrint(printJob);

        if (printRes.success) {
          // Step 4: Mark PRINTED on server
          await apiClient.patch(`/orders/admin/kot/${order._id}/printed`);
          setOrders((prev) =>
            prev.map((o) =>
              o._id === order._id
                ? { ...o, kotPrintStatus: 'PRINTED', kotPrintedAt: new Date().toISOString() }
                : o
            )
          );
          toast.custom((_t) => (
            <div className="bg-stone-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-black">
              🖨️ {printJob.kotNumber} printed to TVS Champ RP Star!
            </div>
          ));
        } else {
          // Step 4b: Mark FAILED on server for retry
          await apiClient.patch(`/orders/admin/kot/${order._id}/failed`);
          setOrders((prev) =>
            prev.map((o) => (o._id === order._id ? { ...o, kotPrintStatus: 'FAILED' } : o))
          );
          toast.error(`KOT print failed for ${printJob.kotNumber}: ${printRes.message}`);
          break; // Stop sequential loop on hardware disconnection
        }
      }
    } finally {
      isProcessingQueueRef.current = false;
    }
  }, [orders, isBridgeOnline, kotModal.isOpen]);

  useEffect(() => {
    // Auto-reconnect previously paired TVS USB printer in Chrome without popups
    autoReconnectWebSerial().then((connected) => {
      setIsSerialConnected(connected);
      if (connected) {
        processPendingKOTQueue();
      }
    });

    requestScreenWakeLock();

    const checkBridge = async () => {
      const health = await checkBridgeHealth();
      setIsBridgeOnline(health.online);
      const connected = isWebSerialConnected();
      setIsSerialConnected(connected);
      if (connected || health.online) {
        processPendingKOTQueue();
      }
    };
    checkBridge();
    const interval = setInterval(checkBridge, 6000);
    return () => {
      clearInterval(interval);
      releaseScreenWakeLock();
    };
  }, [processPendingKOTQueue]);

  const handleOpenKOT = (order: Order, autoPrint = false, isReprint = false) => {
    const time = order.createdAt
      ? new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      : new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    setKotModal({
      isOpen: true,
      orderId: order._id,
      kotNumber: order.kotNumber || `KOT-${order.orderNumber}`,
      tableNumber: order.tableNumber,
      round: order.round,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      time,
      items: order.items.map((it) => ({ name: it.name, quantity: it.quantity, notes: it.notes })),
      specialInstructions: order.specialInstructions || '',
      autoPrint,
      isReprint,
    });
  };

  const handleOpenReceipt = (
    tableNum: string,
    customerName: string,
    ordersList: Order[],
    total: number,
    isSettled: boolean
  ) => {
    setReceiptModal({
      isOpen: true,
      tableNumber: tableNum,
      customerName,
      orders: ordersList,
      totalBill: total,
      isSettled,
    });
  };

  const prevPendingCountRef = useRef<number>(0);
  const prevBillReqCountRef = useRef<number>(0);

  const fetchOrders = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await apiClient.get<{
        success: boolean;
        data: { orders: Order[]; stats: OrderDashboardStats };
      }>('/orders/admin');

      if (res.data.success) {
        const fetchedOrders = res.data.data.orders;
        const fetchedStats = res.data.data.stats;

        // Daily Guard: Auto-reset for new day (keep only today's orders on live dashboard)
        const now = new Date();
        const startOfTodayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const todayOrders = fetchedOrders.filter((o) => {
          if (!o.createdAt) return true;
          return new Date(o.createdAt).getTime() >= startOfTodayMs;
        });

        // Play chime if new order arrived for kitchen OR if guest requested bill receipt
        const currentKitchenCount = todayOrders.length;
        const currentBillReqCount = fetchedStats.billRequestedCount || 0;

        if (
          soundEnabled &&
          (currentKitchenCount > prevPendingCountRef.current || currentBillReqCount > prevBillReqCountRef.current) &&
          !isManual &&
          (prevPendingCountRef.current !== 0 || prevBillReqCountRef.current !== 0)
        ) {
          playOrderNotificationSound();
          if (currentBillReqCount > prevBillReqCountRef.current) {
            toast.custom((_t) => (
              <div className="bg-red-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-black animate-bounce">
                <BellRing className="w-4 h-4 text-white" />
                <span>🔔 Guest requested bill receipt at table!</span>
              </div>
            ));
          }
        }

        prevPendingCountRef.current = currentKitchenCount;
        prevBillReqCountRef.current = currentBillReqCount;

        // On initial page load, record already-printed or finished orders to seen set
        if (!isInitializedRef.current) {
          todayOrders.forEach((o) => {
            if (o.kotPrintStatus === 'PRINTED' || ['served', 'completed', 'cancelled'].includes(o.status)) {
              seenKOTsRef.current.add(o._id);
            }
          });
          isInitializedRef.current = true;
        }

        setOrders(todayOrders);
        setStats(fetchedStats);

        // Automatically process FIFO print queue for any unprinted KOTs
        processPendingKOTQueue(todayOrders);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [soundEnabled, processPendingKOTQueue]);

  // Initial fetch and auto-polling every 6 seconds with Page Visibility guard (rush hour optimization)
  useEffect(() => {
    fetchOrders();

    const interval = setInterval(() => {
      if (document.hidden) return;
      fetchOrders();
    }, 6000);

    const handleVisibilityChange = () => {
      if (!document.hidden) fetchOrders();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await apiClient.patch<{ success: boolean; data: { order: Order } }>(
        `/orders/admin/${orderId}/status`,
        { status: newStatus }
      );

      if (res.data.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
        );
        fetchOrders();
        if (newStatus === 'served') {
          toast.success('Order served & moved to Served tab ✓');
        } else {
          toast.success(`Order status updated to ${newStatus}`);
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update order status');
    }
  };

  const handleDismissBillRequest = async (tableNum: string) => {
    try {
      const res = await apiClient.patch<{ success: boolean; message: string }>(
        `/orders/admin/table/${encodeURIComponent(tableNum)}/dismiss-bill-request`
      );
      if (res.data.success) {
        toast.success(`Bill request alert cleared for Table ${tableNum}`);
        fetchOrders(true);
      }
    } catch (err) {
      console.error('Failed to dismiss bill request:', err);
    }
  };

  // Extract unique table numbers
  const uniqueTables = Array.from(
    new Set(orders.map((o) => o.tableNumber))
  ).sort();

  // Tables currently requesting bill receipt
  const tablesWithBillRequest = Array.from(
    new Set(
      orders
        .filter((o) => o.billRequested)
        .map((o) => o.tableNumber)
    )
  ).sort();

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'bill' && !o.billRequested) return false;
    if (tableFilter !== 'all' && o.tableNumber !== tableFilter) return false;
    return true;
  });

  // Group orders by table for Flow Ordering
  const tableGroups = uniqueTables.map((tableNum) => {
    const tableOrders = orders.filter((o) => o.tableNumber === tableNum);
    const hasBillRequested = tableOrders.some((o) => o.billRequested === true);

    let displayOrders = tableOrders;
    if (statusFilter === 'bill') {
      displayOrders = tableOrders.filter((o) => o.billRequested);
    }

    const totalBill = displayOrders.reduce((sum, o) => {
      const orderTotal = (o.totalAmount && o.totalAmount > 0)
        ? o.totalAmount
        : o.items.reduce((s, it) => s + (it.price * it.quantity), 0);
      return sum + orderTotal;
    }, 0);

    return {
      tableNumber: tableNum,
      displayOrders,
      allOrders: tableOrders,
      totalBill,
      hasPending: tableOrders.some((o) => o.status === 'pending'),
      hasPreparing: tableOrders.some((o) => o.status === 'preparing'),
      hasBillRequested,
      customerName: tableOrders[0]?.customerName || 'Guest',
    };
  }).filter((grp) => {
    if (tableFilter !== 'all' && grp.tableNumber !== tableFilter) return false;
    return grp.displayOrders.length > 0;
  });

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Top Header & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              Live Tableside Orders
            </h1>
            {todayTotalOrdersCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500 text-white animate-pulse shadow-xs">
                {todayTotalOrdersCount} Live Orders Today
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Kitchen & Service Stream · Sukoon Cafe & Bar
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {isSerialConnected ? (
            <Link
              to="/admin/printer-settings"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 shadow-2xs transition-all cursor-pointer"
              title="TVS Champ RP Star USB Connected (Direct Automatic Printing Active)"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>🟢 TVS USB: Auto-Print Active</span>
            </Link>
          ) : isBridgeOnline ? (
            <Link
              to="/admin/printer-settings"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>🟢 TVS Bridge Active</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={async () => {
                const res = await connectWebSerialPrinter();
                setIsSerialConnected(isWebSerialConnected());
                if (res.success) toast.success(res.message);
                else toast.error(res.message);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-all cursor-pointer"
              title="Click to pair TVS USB Printer directly in Chrome"
            >
              <Printer className="w-3.5 h-3.5 text-amber-700" />
              <span>🔌 Connect TVS USB</span>
            </button>
          )}

          {/* Pending KOTs Manual Print / Recovery Button */}
          {pendingPrintCount > 0 && (
            <button
              type="button"
              onClick={() => processPendingKOTQueue()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all cursor-pointer animate-pulse"
              title="Print all pending KOT tickets sequentially"
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              <span>🖨️ Print {pendingPrintCount} Pending KOT{pendingPrintCount > 1 ? 's' : ''}</span>
            </button>
          )}

          {/* Manual Walk-in Order Button */}
          <button
            type="button"
            onClick={() => {
              setPosTable('Table 1');
              setIsPosOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-600/20 transition-all cursor-pointer"
            id="orders-walkin-btn"
          >
            <ChefHat className="w-4 h-4" />
            <span>+ Walk-in Order (POS)</span>
          </button>

          {/* Sound Alert Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              soundEnabled
                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                : 'bg-stone-50 text-stone-400 border-stone-200 hover:bg-stone-100'
            }`}
            title="Toggle audible bell chime on incoming orders"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-600" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Chime ON' : 'Chime Muted'}</span>
          </button>

          {/* Refresh button */}
          <button
            type="button"
            onClick={() => fetchOrders(true)}
            disabled={isRefreshing}
            className="p-2 rounded-xl text-stone-600 border border-stone-200 hover:bg-stone-50 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh orders"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
          </button>

          {/* View mode toggle */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grouped'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Flow Tables
            </button>
            <button
              type="button"
              onClick={() => setViewMode('feed')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'feed'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Order Feed
            </button>
          </div>
        </div>
      </div>

      {/* Top Global Alert Banner for Tableside Bill Requests */}
      {tablesWithBillRequest.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-lg flex items-center justify-between gap-4 flex-wrap animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
              <BellRing className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base tracking-wide">
                🔔 Bill Receipt Requested by {tablesWithBillRequest.length === 1 ? `Table ${cleanTableNumber(tablesWithBillRequest[0])}` : `${tablesWithBillRequest.length} Tables (${tablesWithBillRequest.map(t => `T-${cleanTableNumber(t)}`).join(', ')})`}!
              </h3>
              <p className="text-xs text-white/90">
                Guests have finished dining and requested their bill receipt tableside. Please print and deliver the bill.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tablesWithBillRequest.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  const grp = tableGroups.find(g => g.tableNumber === t);
                  if (grp) {
                    handleOpenReceipt(grp.tableNumber, grp.customerName, grp.displayOrders, grp.totalBill, true);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-white text-stone-900 hover:bg-stone-100 font-extrabold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Receipt className="w-3.5 h-3.5 text-amber-700" />
                <span>Print Table {cleanTableNumber(t)} Bill</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Row: Clean Daily Live Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
            Active Tables
          </div>
          <div className="text-2xl font-black text-stone-900 mt-1">
            {liveActiveTablesCount}
          </div>
          <div className="text-[11px] text-amber-600 font-semibold mt-0.5">
            Tables dining today
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-300 shadow-2xs bg-amber-50/20">
          <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
            <ChefHat className="w-3.5 h-3.5 text-amber-600" />
            <span>Today's Orders</span>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {todayTotalOrdersCount}
          </div>
          <div className="text-[11px] text-amber-600 font-semibold mt-0.5">
            Live orders placed today
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs bg-emerald-50/10">
          <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
            <Printer className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kitchen KOTs</span>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {liveKOTPrintedCount}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            Tickets auto-printed
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
            Today's Total
          </div>
          <div className="text-2xl font-black text-stone-900 mt-1">
            ₹{todayTotalRevenue}
          </div>
          <div className="text-[11px] text-stone-500 font-semibold mt-0.5 flex items-center justify-between flex-wrap gap-1">
            <span>Orders revenue today</span>
            {isAdmin && (
              <Link
                to="/admin/earnings"
                className="text-[11px] font-bold text-amber-700 hover:text-amber-900 underline transition-colors"
                title="Only Owner can view Detailed Monthly & Daily Earnings"
              >
                Owner: Earnings →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Table selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-stone-200">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none touch-pan-x">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'text-stone-500 hover:bg-stone-100'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>Today's Live Orders</span>
            {todayTotalOrdersCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                statusFilter === 'all' ? 'bg-amber-500 text-white' : 'bg-stone-200 text-stone-700'
              }`}>
                {todayTotalOrdersCount}
              </span>
            )}
          </button>

          {tablesWithBillRequest.length > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter('bill')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'bill'
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'text-red-600 hover:bg-red-50'
              }`}
            >
              <BellRing className="w-3.5 h-3.5 animate-bounce" />
              <span>Bill Requests</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-white text-red-600">
                {tablesWithBillRequest.length}
              </span>
            </button>
          )}
        </div>

        {/* Table filter dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400 font-medium">Table:</span>
          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-800 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          >
            <option value="all">All Tables</option>
            {uniqueTables.map((t) => (
              <option key={t} value={t}>
                Table {cleanTableNumber(t)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Order Content */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-stone-400 gap-3">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Loading orders...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 space-y-3 shadow-2xs">
          <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-base font-bold text-stone-800">No Orders Yet</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            When guests scan your QR code and place orders at tables, they will instantly show up here with audio alerts.
          </p>
        </div>
      ) : viewMode === 'grouped' ? (
        /* FLOW ORDERING: TABLE GROUPED VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tableGroups.length === 0 ? (
            <div className="col-span-full py-14 text-center bg-white rounded-3xl border border-stone-200 p-8 shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900">
                {statusFilter === 'bill' ? 'No Pending Bill Requests' : "Ready for Today's Orders ☕"}
              </h3>
              <p className="text-xs text-stone-400 max-w-sm mx-auto">
                {statusFilter === 'bill'
                  ? 'All bill requests have been acknowledged and cleared.'
                  : "Incoming customer orders from tables will automatically stream here with sound alerts and instant KOT thermal printing."}
              </p>
            </div>
          ) : (
            tableGroups.map((grp) => {
              const firstOrder = grp.displayOrders[0] || grp.allOrders[0];

              return (
                <div
                  key={grp.tableNumber}
                  className={`bg-white rounded-3xl border transition-all shadow-sm hover:shadow-md flex flex-col overflow-hidden ${
                    grp.hasBillRequested
                      ? 'border-red-500 ring-4 ring-red-500/20 shadow-lg shadow-red-500/10'
                      : grp.hasPending
                      ? 'border-amber-400 ring-2 ring-amber-400/20'
                      : 'border-stone-200'
                  }`}
                >
                  {/* Tableside Bill Requested Banner */}
                  {grp.hasBillRequested && (
                    <div className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-black flex items-center justify-between gap-2 animate-pulse">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <BellRing className="w-4 h-4 text-amber-300 flex-shrink-0" />
                        <span className="truncate">BILL RECEIPT REQUESTED BY GUEST!</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenReceipt(grp.tableNumber, grp.customerName, grp.displayOrders, grp.totalBill, true)}
                          className="px-2.5 py-1 rounded-lg bg-white text-stone-900 hover:bg-stone-100 text-[10px] uppercase font-black transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Receipt className="w-3 h-3 text-amber-600" />
                          <span>Print Bill</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDismissBillRequest(grp.tableNumber)}
                          className="px-2 py-1 rounded-lg bg-black/30 hover:bg-black/50 text-[10px] uppercase font-bold text-white transition-colors cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Clean Table Card Header */}
                  <div className="p-4 bg-stone-50/80 border-b border-stone-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-stone-900 text-white font-black text-sm flex items-center justify-center shadow-xs flex-shrink-0">
                        T-{cleanTableNumber(grp.tableNumber)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-stone-900 text-base leading-tight">
                          Table {cleanTableNumber(grp.tableNumber)}
                        </h4>
                        <p className="text-xs text-stone-500 font-medium mt-0.5">
                          Guest: <strong className="text-stone-800">{grp.customerName}</strong>
                          {firstOrder?.createdAt && (
                            <span className="text-stone-400 ml-1.5">• {formatTime(firstOrder.createdAt)}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">
                          Total
                        </div>
                        <div className="text-base font-black text-amber-800">
                          ₹{grp.totalBill}
                        </div>
                      </div>

                      {/* Subtle KOT Reprint Icon */}
                      {firstOrder?.kotNumber && (
                        <button
                          type="button"
                          onClick={() => handleOpenKOT(firstOrder, false, true)}
                          className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-200/70 border border-stone-200 transition-colors cursor-pointer"
                          title={`Reprint KOT for Table ${cleanTableNumber(grp.tableNumber)}`}
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Subtle Emergency Cancel Icon */}
                      {firstOrder && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to cancel order for Table ${cleanTableNumber(grp.tableNumber)}?`)) {
                              handleUpdateStatus(firstOrder._id, 'cancelled');
                            }
                          }}
                          className="p-2 rounded-xl text-stone-300 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                          title="Cancel order (Emergency)"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Clean Items List — High Readability for Kitchen & Serving */}
                  <div className="p-4 flex-1 space-y-3">
                    {grp.displayOrders.map((order) => (
                      <div key={order._id} className="space-y-2">
                        <div className="space-y-1.5 bg-stone-50/50 p-3 rounded-2xl border border-stone-100 text-xs">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between text-stone-800 py-0.5">
                              <div className="flex items-center gap-2 truncate">
                                <span
                                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                    it.vegType === 'nonveg' ? 'bg-red-500' : 'bg-emerald-500'
                                  }`}
                                />
                                <span className="font-extrabold text-stone-900 text-sm">{it.quantity}x</span>
                                <span className="font-bold text-stone-800 text-sm truncate">{it.name}</span>
                              </div>
                              <span className="font-semibold text-stone-500 text-xs flex-shrink-0">
                                ₹{it.price * it.quantity}
                              </span>
                            </div>
                          ))}
                        </div>

                        {order.specialInstructions && (
                          <div className="text-xs font-semibold p-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/80">
                            ⚠️ <span className="font-bold">Note:</span> {order.specialInstructions}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Card Footer: Clean Information & Receipt Action */}
                  <div className="p-3.5 bg-stone-50/80 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Order Confirmed · Kitchen Dispatched</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenReceipt(grp.tableNumber, grp.customerName, grp.displayOrders, grp.totalBill, true)}
                      className="px-3.5 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 hover:text-stone-900 font-bold text-xs shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title={`View / Print Bill Receipt for Table ${cleanTableNumber(grp.tableNumber)}`}
                    >
                      <Receipt className="w-3.5 h-3.5 text-amber-600" />
                      <span>Receipt</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* CHRONOLOGICAL FEED VIEW */
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div
              key={order._id}
              className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                order.billRequested
                  ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/10'
                  : order.status === 'pending'
                  ? 'border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/10'
                  : 'border-stone-200'
              }`}
            >
              {/* Left Details */}
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-xs">
                  T-{order.tableNumber}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-stone-900 text-base">
                      Table {cleanTableNumber(order.tableNumber)}
                    </span>
                    <span className="text-xs text-stone-400">
                      • {formatTime(order.createdAt)}
                    </span>
                    {order.billRequested && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-black bg-red-100 text-red-800 border border-red-300 animate-pulse flex items-center gap-1">
                        <BellRing className="w-3 h-3 text-red-600" /> Bill Requested
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-stone-600">
                    Guest: <strong className="text-stone-800">{order.customerName}</strong>
                  </div>

                  {/* Items summary */}
                  <div className="text-xs text-stone-500 flex items-center gap-2 flex-wrap pt-0.5">
                    {order.items.map((it, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 font-medium bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200/60">
                        <strong className="text-stone-900">{it.quantity}x</strong> {it.name}
                      </span>
                    ))}
                  </div>

                  {order.specialInstructions && (
                    <div className="text-xs font-semibold p-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/80">
                      ⚠️ Note: {order.specialInstructions}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Action */}
              <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                <div className="text-right">
                  <div className="text-[10px] text-stone-400 font-bold uppercase">Amount</div>
                  <div className="text-lg font-black text-amber-800">
                    ₹{order.totalAmount}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* KOT Print for single order */}
                  {order.kotNumber && (
                    <button
                      type="button"
                      onClick={() => handleOpenKOT(order, false, true)}
                      className="p-2.5 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      title={`Reprint KOT for Table ${cleanTableNumber(order.tableNumber)}`}
                    >
                      <Printer className="w-4 h-4 text-stone-700" />
                      <span className="hidden sm:inline">KOT</span>
                    </button>
                  )}

                  {/* Bill Receipt for single order */}
                  <button
                    type="button"
                    onClick={() => handleOpenReceipt(order.tableNumber, order.customerName, [order], order.totalAmount, order.status === 'completed')}
                    className="p-2.5 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    title="Generate and Print Receipt"
                  >
                    <Receipt className="w-4 h-4 text-amber-600" />
                    <span className="hidden sm:inline">Receipt</span>
                  </button>

                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Kitchen Confirmed</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual Walk-in POS Order Modal */}
      <ManualOrderModal
        isOpen={isPosOpen}
        onClose={() => setIsPosOpen(false)}
        defaultTable={posTable}
        isTableFixed={false}
        onOrderCreated={(newOrder) => {
          fetchOrders(true);
          if (newOrder) {
            handleOpenKOT(newOrder, true, false);
          }
        }}
      />

      {/* Bill & Quantity Receipt Modal (POS / Thermal Billing Machine Compatible) */}
      <BillReceiptModal
        isOpen={receiptModal.isOpen}
        onClose={() => setReceiptModal((prev) => ({ ...prev, isOpen: false }))}
        tableNumber={receiptModal.tableNumber}
        customerName={receiptModal.customerName}
        orders={receiptModal.orders}
        totalBill={receiptModal.totalBill}
        isSettled={receiptModal.isSettled}
      />

      {/* KOT Ticket Modal */}
      <KOTTicketModal
        isOpen={kotModal.isOpen}
        onClose={() => {
          setKotModal((prev) => ({ ...prev, isOpen: false }));
          setTimeout(() => {
            processPendingKOTQueue();
          }, 600);
        }}
        onPrinted={async () => {
          if (kotModal.orderId) {
            try {
              await apiClient.patch(`/orders/admin/kot/${kotModal.orderId}/printed`);
              setOrders((prev) =>
                prev.map((o) =>
                  o._id === kotModal.orderId
                    ? { ...o, kotPrintStatus: 'PRINTED', kotPrintedAt: new Date().toISOString() }
                    : o
                )
              );
            } catch (err) {
              console.error('Failed to update KOT print status to PRINTED:', err);
            }
          }
        }}
        kotNumber={kotModal.kotNumber}
        tableNumber={kotModal.tableNumber}
        round={kotModal.round}
        orderNumber={kotModal.orderNumber}
        customerName={kotModal.customerName}
        time={kotModal.time}
        items={kotModal.items}
        specialInstructions={kotModal.specialInstructions}
        autoPrint={kotModal.autoPrint}
        isReprint={kotModal.isReprint}
      />
    </div>
  );
}
