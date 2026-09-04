import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ShoppingBag,
  Clock,
  ChefHat,
  CheckCircle2,
  XCircle,
  Volume2,
  VolumeX,
  RefreshCw,
  Utensils,
  CreditCard,
} from 'lucide-react';
import apiClient from '../../api/client';
import type { Order, OrderStatus, OrderDashboardStats } from '../../types/menu';
import { playOrderNotificationSound } from '../../utils/sound';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderDashboardStats>({
    pendingCount: 0,
    preparingCount: 0,
    servedCount: 0,
    activeCount: 0,
    todayOrdersCount: 0,
    todaySales: 0,
  });
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grouped' | 'feed'>('grouped');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const prevPendingCountRef = useRef<number>(0);

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

        // Play chime if new pending order arrived
        if (
          soundEnabled &&
          fetchedStats.pendingCount > prevPendingCountRef.current &&
          !isManual &&
          prevPendingCountRef.current !== 0
        ) {
          playOrderNotificationSound();
        }

        prevPendingCountRef.current = fetchedStats.pendingCount;
        setOrders(fetchedOrders);
        setStats(fetchedStats);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [soundEnabled]);

  // Initial fetch and auto-polling every 6 seconds
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders();
    }, 6000);

    return () => clearInterval(interval);
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
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSettleTable = async (tableNum: string) => {
    if (!window.confirm(`Settle and close all active orders for Table ${tableNum}?`)) {
      return;
    }

    try {
      const res = await apiClient.patch<{ success: boolean; message: string }>(
        `/orders/admin/table/${encodeURIComponent(tableNum)}/settle`
      );

      if (res.data.success) {
        fetchOrders(true);
      }
    } catch (err) {
      console.error('Failed to settle table:', err);
    }
  };

  const handleResetTable = async (tableNum: string) => {
    if (!window.confirm(`Force reset session for Table ${tableNum}? This will clear active table orders immediately.`)) {
      return;
    }

    try {
      const res = await apiClient.post<{ success: boolean; message: string }>(
        `/orders/admin/table/${encodeURIComponent(tableNum)}/reset`
      );

      if (res.data.success) {
        fetchOrders(true);
      }
    } catch (err) {
      console.error('Failed to reset table:', err);
    }
  };

  // Extract unique table numbers
  const uniqueTables = Array.from(
    new Set(orders.map((o) => o.tableNumber))
  ).sort();

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (tableFilter !== 'all' && o.tableNumber !== tableFilter) return false;
    return true;
  });

  // Group orders by table for Flow Ordering
  const tableGroups = uniqueTables.map((tableNum) => {
    const tableOrders = orders.filter((o) => o.tableNumber === tableNum);
    const activeOrders = tableOrders.filter((o) => ['pending', 'preparing', 'served'].includes(o.status));
    const totalBill = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      tableNumber: tableNum,
      activeOrders,
      allOrders: tableOrders,
      totalBill,
      hasPending: activeOrders.some((o) => o.status === 'pending'),
      hasPreparing: activeOrders.some((o) => o.status === 'preparing'),
      customerName: activeOrders[0]?.customerName || tableOrders[0]?.customerName || 'Guest',
    };
  }).filter((grp) => {
    if (tableFilter !== 'all' && grp.tableNumber !== tableFilter) return false;
    if (statusFilter !== 'all') {
      return grp.allOrders.some((o) => o.status === statusFilter);
    }
    return grp.activeOrders.length > 0;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse flex items-center gap-1">
            <Clock className="w-3 h-3" /> New / Pending
          </span>
        );
      case 'preparing':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
            <ChefHat className="w-3 h-3" /> Preparing
          </span>
        );
      case 'served':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
            <Utensils className="w-3 h-3" /> Served
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              Live Tableside Orders
            </h1>
            {stats.pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-red-500 text-white animate-bounce shadow-xs">
                {stats.pendingCount} New!
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Receptionist & Kitchen Order Stream · Sukoon Cafe & Bar
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
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

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
            Active Orders
          </div>
          <div className="text-2xl font-black text-stone-900 mt-1">
            {stats.activeCount}
          </div>
          <div className="text-[11px] text-amber-600 font-semibold mt-0.5">
            Tables dining now
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-300 shadow-2xs bg-amber-50/20">
          <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
            Pending / New
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {stats.pendingCount}
          </div>
          <div className="text-[11px] text-amber-600 font-semibold mt-0.5">
            Awaiting acceptance
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
            In Kitchen
          </div>
          <div className="text-2xl font-black text-blue-700 mt-1">
            {stats.preparingCount}
          </div>
          <div className="text-[11px] text-stone-500 font-semibold mt-0.5">
            Being prepared
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
            Today's Table Sales
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            ₹{stats.todaySales}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            {stats.todayOrdersCount} orders placed today
          </div>
        </div>
      </div>

      {/* Filter Tabs & Table selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-stone-200">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'pending', 'preparing', 'served', 'completed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'text-stone-500 hover:bg-stone-100'
              }`}
            >
              {st === 'all' ? 'All Orders' : st}
            </button>
          ))}
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
                Table {t}
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
            <div className="col-span-full py-12 text-center text-stone-400 bg-white rounded-2xl border border-stone-200">
              No active tables matching filter.
            </div>
          ) : (
            tableGroups.map((grp) => (
              <div
                key={grp.tableNumber}
                className={`bg-white rounded-2xl border transition-all shadow-2xs flex flex-col overflow-hidden ${
                  grp.hasPending
                    ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-amber-500/10'
                    : 'border-stone-200'
                }`}
              >
                {/* Table Card Header */}
                <div className="p-4 bg-stone-50/80 border-b border-stone-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-stone-900 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      T-{grp.tableNumber}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-stone-900 text-sm">
                        Table {grp.tableNumber}
                      </h4>
                      <p className="text-[11px] text-stone-400 font-medium">
                        Guest: <strong className="text-stone-700">{grp.customerName}</strong> ·{' '}
                        {grp.activeOrders.length} active round{grp.activeOrders.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Cumulative Table Bill Badge */}
                  <div className="text-right">
                    <div className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">
                      Running Total
                    </div>
                    <div className="text-base font-black text-amber-700">
                      ₹{grp.totalBill}
                    </div>
                  </div>
                </div>

                {/* Table Rounds List */}
                <div className="p-4 flex-1 space-y-4 divide-y divide-stone-100">
                  {grp.activeOrders.map((order) => (
                    <div key={order._id} className="pt-3 first:pt-0 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-stone-900">
                            {order.orderNumber}
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">
                            Round {order.round}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {formatTime(order.createdAt)}
                          </span>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>

                      {/* Items */}
                      <div className="space-y-1.5 bg-stone-50/50 p-2.5 rounded-xl border border-stone-100/80 text-xs">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between text-stone-700">
                            <div className="flex items-center gap-1.5 truncate">
                              <span
                                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  it.vegType === 'nonveg' ? 'bg-red-500' : 'bg-emerald-500'
                                }`}
                              />
                              <span className="font-bold text-stone-900">{it.quantity}x</span>
                              <span className="truncate">{it.name}</span>
                            </div>
                            <span className="font-semibold text-stone-900 flex-shrink-0">
                              ₹{it.price * it.quantity}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Kitchen special instructions */}
                      {order.specialInstructions && (
                        <div className="text-[11px] p-2 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/60 italic">
                          <strong>Note:</strong> {order.specialInstructions}
                        </div>
                      )}

                      {/* Order status actions */}
                      <div className="flex items-center gap-2 pt-1">
                        {order.status === 'pending' && (
                          <button
                            type="button"
                            disabled={updatingId === order._id}
                            onClick={() => handleUpdateStatus(order._id, 'preparing')}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs uppercase tracking-wider shadow-2xs transition-all cursor-pointer"
                          >
                            Accept & Prepare 👨‍🍳
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            type="button"
                            disabled={updatingId === order._id}
                            onClick={() => handleUpdateStatus(order._id, 'served')}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-2xs transition-all cursor-pointer"
                          >
                            Mark as Served ☕
                          </button>
                        )}
                        {order.status === 'served' && (
                          <button
                            type="button"
                            disabled={updatingId === order._id}
                            onClick={() => handleUpdateStatus(order._id, 'completed')}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-2xs transition-all cursor-pointer"
                          >
                            Complete Order ✓
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(order._id, 'cancelled')}
                          className="px-2.5 py-1.5 rounded-lg text-stone-400 hover:text-red-500 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Settle / Clear Entire Table Bill CTA */}
                <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleResetTable(grp.tableNumber)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-stone-500 hover:text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors cursor-pointer border border-transparent hover:border-red-200"
                    title="Force clear active session for this table"
                  >
                    <span>Clear Table</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSettleTable(grp.tableNumber)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Settle Bill (₹{grp.totalBill})</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* CHRONOLOGICAL FEED VIEW */
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div
              key={order._id}
              className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                order.status === 'pending'
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
                    <span className="font-black text-stone-900 text-base">
                      {order.orderNumber}
                    </span>
                    <span className="text-xs font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                      Round {order.round}
                    </span>
                    {getStatusBadge(order.status)}
                    <span className="text-xs text-stone-400">
                      {formatTime(order.createdAt)}
                    </span>
                  </div>

                  <div className="text-xs text-stone-600">
                    Guest: <strong>{order.customerName}</strong> · Table{' '}
                    <strong>{order.tableNumber}</strong>
                  </div>

                  {/* Items summary */}
                  <div className="text-xs text-stone-500 flex items-center gap-2 flex-wrap pt-0.5">
                    {order.items.map((it, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 font-medium bg-stone-50 px-2 py-0.5 rounded-md border border-stone-200/60">
                        <strong className="text-stone-900">{it.quantity}x</strong> {it.name}
                      </span>
                    ))}
                  </div>

                  {order.specialInstructions && (
                    <div className="text-[11px] text-amber-800 italic">
                      Note: {order.specialInstructions}
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
                  {order.status === 'pending' && (
                    <button
                      type="button"
                      disabled={updatingId === order._id}
                      onClick={() => handleUpdateStatus(order._id, 'preparing')}
                      className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs uppercase tracking-wider shadow-2xs transition-all cursor-pointer"
                    >
                      Accept
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      type="button"
                      disabled={updatingId === order._id}
                      onClick={() => handleUpdateStatus(order._id, 'served')}
                      className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-2xs transition-all cursor-pointer"
                    >
                      Served
                    </button>
                  )}
                  {order.status === 'served' && (
                    <button
                      type="button"
                      disabled={updatingId === order._id}
                      onClick={() => handleUpdateStatus(order._id, 'completed')}
                      className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-2xs transition-all cursor-pointer"
                    >
                      Settle Bill
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
