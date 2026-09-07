import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  ChefHat,
  CheckCircle2,
  Clock,
  Printer,
  Volume2,
  VolumeX,
  RefreshCw,
  Search,
  AlertTriangle,
  Flame,
  Check,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/client';
import type { Order, OrderStatus, OrderDashboardStats } from '../../types/menu';
import { playOrderNotificationSound } from '../../utils/sound';
import KOTTicketModal from '../../components/admin/KOTTicketModal';
import ManualOrderModal from '../../components/admin/ManualOrderModal';
import { Link } from 'react-router-dom';
import {
  checkBridgeHealth,
  printKOTViaBridge,
  isWebSerialConnected,
  printKOTViaWebSerial,
  autoReconnectWebSerial,
  connectWebSerialPrinter,
} from '../../services/printBridge';

interface AggregatedKitchenItem {
  name: string;
  totalQuantity: number;
  vegType: 'veg' | 'nonveg';
  tables: Array<{ tableNumber: string; quantity: number; orderNumber: string; kotNumber?: string; round: number }>;
  notes: string[];
}

export default function KitchenPipelinePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderDashboardStats>({
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'cooking' | 'served'>('cooking');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegFilter, setVegFilter] = useState<'all' | 'veg' | 'nonveg'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isBridgeOnline, setIsBridgeOnline] = useState(false);
  const [isSerialConnected, setIsSerialConnected] = useState(isWebSerialConnected());

  // Manual POS Order Modal
  const [isPosOpen, setIsPosOpen] = useState(false);

  // Check off prepared items in batch view locally
  const [preparedDishKeys, setPreparedDishKeys] = useState<Set<string>>(new Set());

  // KOT Ticket Modal State
  const [kotModal, setKotModal] = useState<{
    isOpen: boolean;
    kotNumber: string;
    tableNumber: string;
    round: number;
    orderNumber: string;
    customerName: string;
    time: string;
    items: Array<{ name: string; quantity: number; notes?: string }>;
    specialInstructions: string;
    autoPrint: boolean;
  }>({
    isOpen: false,
    kotNumber: '',
    tableNumber: '',
    round: 1,
    orderNumber: '',
    customerName: '',
    time: '',
    items: [],
    specialInstructions: '',
    autoPrint: false,
  });

  const prevPendingCountRef = useRef<number>(0);
  const seenKOTsRef = useRef<Set<string>>(new Set());
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Auto-reconnect previously paired TVS USB printer in Chrome without popups
    autoReconnectWebSerial().then((connected) => {
      setIsSerialConnected(connected);
    });

    const checkBridge = async () => {
      const health = await checkBridgeHealth();
      setIsBridgeOnline(health.online);
      setIsSerialConnected(isWebSerialConnected());
    };
    checkBridge();
    const interval = setInterval(checkBridge, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenKOT = async (order: Order, autoPrint = false) => {
    const time = order.createdAt
      ? new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      : new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const kotPayload = {
      kotNumber: order.kotNumber || `KOT-${order.orderNumber}`,
      tableNumber: order.tableNumber,
      round: order.round,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      time,
      items: order.items.map((it) => ({ name: it.name, quantity: it.quantity, notes: it.notes })),
      specialInstructions: order.specialInstructions || '',
      autoPrint,
    };
    
    // 1. Direct Chrome USB Serial (Zero-installation direct to TVS printer)
    if (autoPrint && isWebSerialConnected()) {
      const res = await printKOTViaWebSerial(kotPayload);
      if (res.success) {
        toast.custom((_t) => (
          <div className="bg-stone-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-black">
            🖨️ {kotPayload.kotNumber} printed to TVS Champ RP Star (USB)!
          </div>
        ));
        return; // Silent, hands-free!
      }
    }

    // 2. Local Bridge (if running)
    if (autoPrint && isBridgeOnline) {
      const res = await printKOTViaBridge(kotPayload);
      if (res.success) {
        toast.custom((_t) => (
          <div className="bg-stone-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-black">
            🖨️ {kotPayload.kotNumber} sent to TVS Champ RP Star!
          </div>
        ));
        return; // Silent, hands-free! Do not open modal.
      }
    }

    setKotModal({
      isOpen: true,
      ...kotPayload
    });
  };

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

        const currentKitchenCount = (fetchedStats.preparingCount || 0) + (fetchedStats.pendingCount || 0);

        if (
          soundEnabled &&
          currentKitchenCount > prevPendingCountRef.current &&
          !isManual &&
          prevPendingCountRef.current !== 0
        ) {
          playOrderNotificationSound();
          toast.custom((_t) => (
            <div className="bg-amber-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-black animate-bounce">
              <ChefHat className="w-4 h-4 text-white" />
              <span>🍳 New Kitchen Order Ticket (KOT) arrived!</span>
            </div>
          ));
        }

        prevPendingCountRef.current = currentKitchenCount;
        setOrders(fetchedOrders);
        setStats(fetchedStats);

        // Record and auto-print new incoming KOTs (kitchen thermal printing)
        if (!isInitializedRef.current) {
          isInitializedRef.current = true;
          fetchedOrders.forEach((o) => {
            if (o.kotNumber) seenKOTsRef.current.add(o.kotNumber);
          });
        } else {
          const autoPrintKOT = localStorage.getItem('sukoon_auto_print_kot') !== 'false';
          const newKOTOrders = fetchedOrders.filter(
            (o) => o.kotNumber && !seenKOTsRef.current.has(o.kotNumber)
          );
          newKOTOrders.forEach((o) => seenKOTsRef.current.add(o.kotNumber!));

          if (autoPrintKOT && newKOTOrders.length > 0) {
            handleOpenKOT(newKOTOrders[0], true);
            if (newKOTOrders.length > 1) {
              toast.custom((_t) => (
                <div className="bg-stone-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-black">
                  🖨️ {newKOTOrders.length} new orders received! Printing tickets...
                </div>
              ));
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch kitchen orders:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [soundEnabled]);

  useEffect(() => {
    fetchOrders();

    const interval = setInterval(() => {
      if (document.hidden) return;
      fetchOrders();
    }, 5000);

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
    setUpdatingId(orderId);
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
        toast.success(`KOT marked as ${newStatus === 'served' ? 'Cooked & Served ✓' : newStatus}`);
      }
    } catch (err) {
      console.error('Failed to update KOT status:', err);
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const cookingOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'pending' || o.status === 'preparing');
  }, [orders]);

  const aggregatedKitchenItems = useMemo(() => {
    const itemMap = new Map<string, AggregatedKitchenItem>();

    cookingOrders.forEach((order) => {
      order.items.forEach((it) => {
        const key = it.name.trim().toLowerCase();
        const existing = itemMap.get(key);

        if (existing) {
          existing.totalQuantity += it.quantity;
          existing.tables.push({
            tableNumber: order.tableNumber,
            quantity: it.quantity,
            orderNumber: order.orderNumber,
            kotNumber: order.kotNumber,
            round: order.round,
          });
          if (it.notes && it.notes.trim() && !existing.notes.includes(it.notes.trim())) {
            existing.notes.push(`T-${order.tableNumber}: ${it.notes.trim()}`);
          }
        } else {
          itemMap.set(key, {
            name: it.name,
            totalQuantity: it.quantity,
            vegType: it.vegType || 'veg',
            tables: [
              {
                tableNumber: order.tableNumber,
                quantity: it.quantity,
                orderNumber: order.orderNumber,
                kotNumber: order.kotNumber,
                round: order.round,
              },
            ],
            notes: it.notes && it.notes.trim() ? [`T-${order.tableNumber}: ${it.notes.trim()}`] : [],
          });
        }
      });
    });

    let items = Array.from(itemMap.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);

    if (vegFilter !== 'all') {
      items = items.filter((it) => it.vegType === vegFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((it) => it.name.toLowerCase().includes(q));
    }

    return items;
  }, [cookingOrders, vegFilter, searchQuery]);

  const totalCookingItemsCount = useMemo(() => {
    return cookingOrders.reduce((sum, o) => sum + (o.totalItems || o.items.reduce((s, it) => s + it.quantity, 0)), 0);
  }, [cookingOrders]);

  const filteredKOTs = useMemo(() => {
    return orders.filter((order) => {
      if (activeTab === 'cooking') {
        if (order.status !== 'pending' && order.status !== 'preparing') return false;
      } else if (activeTab === 'served') {
        if (order.status !== 'served' && order.status !== 'completed') return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDish = order.items.some((it) => it.name.toLowerCase().includes(q));
        const matchTable = order.tableNumber.toLowerCase().includes(q);
        const matchKOT = order.kotNumber?.toLowerCase().includes(q);
        const matchOrder = order.orderNumber.toLowerCase().includes(q);
        return matchDish || matchTable || matchKOT || matchOrder;
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  const toggleDishPrepared = (name: string) => {
    setPreparedDishKeys((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const formatElapsed = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins === 1) return '1 min ago';
      return `${diffMins} mins ago`;
    } catch {
      return '';
    }
  };

  const isRushed = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      return diffMs > 15 * 60000;
    } catch {
      return false;
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      {/* Top Header & Printer Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                  Kitchen KOT & Qty Pipeline
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-stone-900 text-white shadow-2xs">
                  {cookingOrders.length} KOTs Active
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                  {totalCookingItemsCount} Items to Cook
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Real-time batch preparation stream & TVS Champ RP Star thermal ticketing
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Printer Hardware Status Badge */}
          {isSerialConnected ? (
            <Link
              to="/admin/printer-settings"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 shadow-2xs transition-all cursor-pointer"
              title="TVS Champ RP Star USB Connected (Direct Automatic Printing Active)"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden md:inline">🟢 TVS USB: Auto-Print Active</span>
              <span className="md:hidden">🟢 TVS USB Active</span>
            </Link>
          ) : isBridgeOnline ? (
            <Link
              to="/admin/printer-settings"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden md:inline">🟢 TVS Bridge Active</span>
              <span className="md:hidden">🟢 TVS Bridge</span>
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-all cursor-pointer"
              title="Click to pair TVS USB Printer directly in Chrome"
            >
              <Printer className="w-3.5 h-3.5 text-amber-700" />
              <span>🔌 Connect TVS USB</span>
            </button>
          )}

          {/* Walk-in Order POS button */}
          <button
            type="button"
            onClick={() => setIsPosOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-xs transition-all cursor-pointer"
          >
            <ChefHat className="w-4 h-4" />
            <span>+ Walk-in POS</span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              soundEnabled
                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                : 'bg-stone-50 text-stone-400 border-stone-200 hover:bg-stone-100'
            }`}
            title="Audible chime on new incoming kitchen orders"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-600" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
          </button>

          {/* Refresh button */}
          <button
            type="button"
            onClick={() => fetchOrders(true)}
            disabled={isRefreshing}
            className="p-2 rounded-xl text-stone-600 border border-stone-200 hover:bg-stone-50 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh kitchen orders"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
          </button>

          {/* Live Orders page link */}
          <Link
            to="/admin/orders"
            className="p-2 rounded-xl text-stone-600 border border-stone-200 hover:bg-stone-50 transition-colors cursor-pointer"
            title="View Live Tableside Billing Orders"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ─── SECTION 1: BATCH QUANTITY PREPARATION (Total Qty Process) ─── */}
      <div className="bg-white p-5 rounded-3xl border border-amber-300 shadow-2xs bg-gradient-to-br from-amber-50/20 via-white to-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/80">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-600 animate-pulse" />
              <h2 className="text-base font-black text-stone-900 tracking-tight">
                Live Cooking Quantities (Batch Cook Qty Process)
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Aggregated total quantities across all active tables. Tap a dish to mark it prepared as you cook.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Veg filter */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs font-bold border border-stone-200">
              <button
                type="button"
                onClick={() => setVegFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  vegFilter === 'all' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                }`}
              >
                All ({aggregatedKitchenItems.length})
              </button>
              <button
                type="button"
                onClick={() => setVegFilter('veg')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  vegFilter === 'veg' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-stone-500'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                Veg
              </button>
              <button
                type="button"
                onClick={() => setVegFilter('nonveg')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  vegFilter === 'nonveg' ? 'bg-red-600 text-white shadow-2xs' : 'text-stone-500'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-300" />
                Non-Veg
              </button>
            </div>
          </div>
        </div>

        {aggregatedKitchenItems.length === 0 ? (
          <div className="py-8 text-center text-stone-400 space-y-1">
            <Sparkles className="w-8 h-8 mx-auto text-amber-400 opacity-60" />
            <p className="text-xs font-bold text-stone-700">Kitchen is all caught up!</p>
            <p className="text-[11px] text-stone-400">No pending dishes to cook right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {aggregatedKitchenItems.map((item) => {
              const isChecked = preparedDishKeys.has(item.name);
              return (
                <div
                  key={item.name}
                  onClick={() => toggleDishPrepared(item.name)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 select-none ${
                    isChecked
                      ? 'bg-emerald-50/50 border-emerald-300 opacity-70'
                      : 'bg-white hover:border-amber-400 shadow-2xs border-stone-200 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <span
                        className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          item.vegType === 'nonveg' ? 'border-red-600' : 'border-emerald-600'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.vegType === 'nonveg' ? 'bg-red-600' : 'bg-emerald-600'
                          }`}
                        />
                      </span>
                      <div className="min-w-0">
                        <h4
                          className={`font-black text-xs sm:text-sm truncate leading-tight ${
                            isChecked ? 'line-through text-stone-400' : 'text-stone-900'
                          }`}
                        >
                          {item.name}
                        </h4>
                        <div className="text-[10px] text-stone-500 font-medium mt-0.5">
                          {item.tables.map((t) => `T-${t.tableNumber} (x${t.quantity})`).join(' · ')}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-xl text-sm font-black flex-shrink-0 shadow-2xs ${
                        isChecked
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-600 text-white'
                      }`}
                    >
                      {item.totalQuantity}x
                    </span>
                  </div>

                  {item.notes.length > 0 && (
                    <div className="text-[10px] p-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/70 italic">
                      {item.notes.join(' | ')}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-[10px]">
                    <span className="text-stone-400">
                      {item.tables.length} table{item.tables.length > 1 ? 's' : ''} waiting
                    </span>
                    <span className={`font-bold flex items-center gap-1 ${isChecked ? 'text-emerald-700' : 'text-stone-400'}`}>
                      {isChecked ? <Check className="w-3 h-3 text-emerald-600" /> : null}
                      {isChecked ? 'Prepared' : 'Tap to mark done'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── SECTION 2: LIVE KOT TICKETS PIPELINE ─── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('cooking')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'cooking'
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'text-stone-500 hover:bg-stone-100'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5 text-amber-400" />
              <span>1. Cooking / Preparing ({cookingOrders.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('served')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'served'
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'text-stone-500 hover:bg-stone-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>2. Cooked & Served ({stats.servedCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'text-stone-500 hover:bg-stone-100'
              }`}
            >
              All KOTs
            </button>
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search table, dish, KOT #..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-amber-500 bg-stone-50/50"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-stone-400 gap-3">
            <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold">Loading Kitchen Tickets...</span>
          </div>
        ) : filteredKOTs.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 space-y-2">
            <ChefHat className="w-10 h-10 text-stone-300 mx-auto" />
            <h3 className="text-sm font-bold text-stone-800">No Tickets in this section</h3>
            <p className="text-xs text-stone-400">
              When customers order via QR or POS, kitchen tickets will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredKOTs.map((order) => {
              const isCooking = order.status === 'pending' || order.status === 'preparing';
              const isUrgent = isCooking && isRushed(order.createdAt.toString());

              return (
                <div
                  key={order._id}
                  className={`bg-white rounded-2xl border transition-all shadow-2xs flex flex-col overflow-hidden ${
                    isUrgent
                      ? 'border-red-500 ring-2 ring-red-500/20 shadow-red-500/10'
                      : isCooking
                      ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-amber-500/10'
                      : 'border-stone-200'
                  }`}
                >
                  {isUrgent && (
                    <div className="px-4 py-1.5 bg-red-600 text-white text-[11px] font-black flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
                        <span>RUSH ORDER · {formatElapsed(order.createdAt.toString())}</span>
                      </div>
                      <span className="uppercase text-[9px] font-extrabold bg-black/30 px-1.5 py-0.5 rounded">
                        Priority
                      </span>
                    </div>
                  )}

                  <div className="p-4 bg-stone-50/80 border-b border-stone-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="px-3 py-1.5 rounded-xl bg-stone-900 text-white font-black text-xs tracking-wider shadow-xs">
                        {order.kotNumber || `KOT-${order.orderNumber}`}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-stone-900 text-sm">
                            Table {order.tableNumber}
                          </span>
                          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-stone-200 text-stone-700">
                            R{order.round}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 font-medium">
                          Guest: <strong className="text-stone-700">{order.customerName}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-stone-500 justify-end">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>{formatElapsed(order.createdAt.toString())}</span>
                      </div>
                      <div className="text-[10px] text-stone-400 font-medium">
                        {order.orderNumber}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 flex-1 space-y-2 divide-y divide-stone-100 font-mono">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="pt-2 first:pt-0 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 min-w-0">
                          <span
                            className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              it.vegType === 'nonveg' ? 'border-red-600' : 'border-emerald-600'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                it.vegType === 'nonveg' ? 'bg-red-600' : 'bg-emerald-600'
                              }`}
                            />
                          </span>
                          <div className="min-w-0">
                            <span className="font-bold text-sm text-stone-900 leading-snug">
                              {it.name}
                            </span>
                            {it.notes && (
                              <div className="text-[11px] text-amber-800 italic pt-0.5 font-sans">
                                → {it.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        <span className="text-base font-black text-stone-900 px-2.5 py-0.5 rounded-lg bg-stone-100 flex-shrink-0">
                          {it.quantity}x
                        </span>
                      </div>
                    ))}

                    {order.specialInstructions && (
                      <div className="pt-2.5 font-sans">
                        <div className="text-[11px] p-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 font-semibold italic">
                          <strong>Note:</strong> {order.specialInstructions}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenKOT(order)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-stone-700 hover:text-stone-950 bg-white hover:bg-stone-100 border border-stone-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                      title="Print KOT to TVS Champ RP Star (80mm)"
                    >
                      <Printer className="w-3.5 h-3.5 text-stone-900" />
                      <span>Print KOT</span>
                    </button>

                    {isCooking ? (
                      <button
                        type="button"
                        disabled={updatingId === order._id}
                        onClick={() => handleUpdateStatus(order._id, 'served')}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Cooked & Ready ✓</span>
                      </button>
                    ) : (
                      <div className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Cooked & Served ✓</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ManualOrderModal
        isOpen={isPosOpen}
        onClose={() => setIsPosOpen(false)}
        defaultTable="Table 1"
        isTableFixed={false}
        onOrderCreated={(newOrder) => {
          fetchOrders(true);
          if (newOrder) {
            handleOpenKOT(newOrder, true);
          }
        }}
      />

      <KOTTicketModal
        isOpen={kotModal.isOpen}
        onClose={() => setKotModal((prev) => ({ ...prev, isOpen: false }))}
        kotNumber={kotModal.kotNumber}
        tableNumber={kotModal.tableNumber}
        round={kotModal.round}
        orderNumber={kotModal.orderNumber}
        customerName={kotModal.customerName}
        time={kotModal.time}
        items={kotModal.items}
        specialInstructions={kotModal.specialInstructions}
        autoPrint={kotModal.autoPrint}
      />
    </div>
  );
}
