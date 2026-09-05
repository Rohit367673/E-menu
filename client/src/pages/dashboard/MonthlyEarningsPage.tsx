import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Utensils,
  Award,
  Clock,
  User,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';

interface DayItemSold {
  name: string;
  quantity: number;
  price: number;
  totalRevenue: number;
  vegType: string;
}

interface DayOrderSummary {
  _id: string;
  orderNumber: string;
  tableNumber: string;
  customerName: string;
  time: string;
  totalAmount: number;
  itemsCount: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    vegType?: string;
  }>;
}

interface DayReport {
  day: number;
  dateStr: string;
  dayOfWeek: string;
  totalSales: number;
  ordersCount: number;
  itemsCount: number;
  itemsSold: DayItemSold[];
  orders: DayOrderSummary[];
}

interface MonthlyReportData {
  year: number;
  month: number;
  monthName: string;
  totalMonthSales: number;
  totalMonthOrders: number;
  totalMonthItems: number;
  topSellingDish: string;
  days: DayReport[];
}

export default function MonthlyEarningsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role !== 'manager';

  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const [report, setReport] = useState<MonthlyReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({});

  const fetchMonthlyReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<{
        success: boolean;
        data: MonthlyReportData;
      }>(`/orders/admin/earnings/monthly?year=${selectedYear}&month=${selectedMonth}`);

      if (res.data.success && res.data.data) {
        setReport(res.data.data);
        // By default, expand today's date if viewing current month
        if (
          selectedYear === today.getFullYear() &&
          selectedMonth === today.getMonth() + 1
        ) {
          setExpandedDays({ [today.getDate()]: true });
        } else {
          setExpandedDays({});
        }
      }
    } catch (err) {
      console.error('Failed to load monthly earnings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    if (isAdmin) {
      fetchMonthlyReport();
    }
  }, [fetchMonthlyReport, isAdmin]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const toggleDayExpansion = (dayNum: number) => {
    setExpandedDays((prev) => ({
      ...prev,
      [dayNum]: !prev[dayNum],
    }));
  };

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center bg-white rounded-3xl border border-stone-200 mt-12 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-black text-stone-900">Restricted Access</h2>
        <p className="text-xs text-stone-500 mt-2">
          Monthly financial earnings and dish sales records are confidential to the Owner account only.
        </p>
      </div>
    );
  }

  const isCurrentMonthView =
    selectedYear === today.getFullYear() &&
    selectedMonth === today.getMonth() + 1;

  const todayDay = today.getDate();
  const todayReport = isCurrentMonthView
    ? report?.days?.find((d) => d.day === todayDay)
    : null;

  const todaySales = todayReport?.totalSales ?? 0;
  const todayOrders = todayReport?.ordersCount ?? 0;
  const todayItems = todayReport?.itemsCount ?? 0;

  return (
    <div className="admin-page flex flex-col gap-6 py-2 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
              👑 Owner Financial Analytics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Monthly Earnings & Sales Explorer
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Day-by-day revenue, order logs, and itemized dish sales breakdown
          </p>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-2 bg-stone-50 p-1.5 rounded-2xl border border-stone-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 rounded-xl text-stone-600 hover:bg-white hover:text-stone-900 hover:shadow-2xs transition-all cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="px-4 py-1 flex items-center gap-2 font-black text-stone-900 text-sm">
            <Calendar className="w-4 h-4 text-amber-600" />
            <span>
              {report?.monthName || 'Month'} {selectedYear}
            </span>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 rounded-xl text-stone-600 hover:bg-white hover:text-stone-900 hover:shadow-2xs transition-all cursor-pointer"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={fetchMonthlyReport}
            disabled={isLoading}
            className="p-2 rounded-xl text-stone-500 hover:bg-white hover:text-amber-700 transition-all cursor-pointer"
            title="Refresh data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Month Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Table Earnings (Dedicated Owner Metric) */}
        <div className="bg-white p-5 rounded-3xl border border-amber-300 bg-gradient-to-br from-amber-500/10 via-white to-transparent shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
              Today's Earnings
            </div>
            {isCurrentMonthView && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 border border-amber-300">
                Today
              </span>
            )}
          </div>
          <div className="text-3xl font-black text-amber-800 mt-1.5">
            ₹{todaySales}
          </div>
          <div className="text-xs font-semibold text-amber-700 mt-1 flex items-center gap-1">
            <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
            <span>{todayOrders} orders today · {todayItems} dishes</span>
          </div>
        </div>

        {/* Total Month Sales */}
        <div className="bg-white p-5 rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 via-white to-transparent shadow-2xs">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
            Total Month Earnings
          </div>
          <div className="text-3xl font-black text-emerald-700 mt-1.5">
            ₹{report?.totalMonthSales ?? 0}
          </div>
          <div className="text-xs font-semibold text-emerald-800/80 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Entire {report?.monthName || 'month'} revenue</span>
          </div>
        </div>

        {/* Total Month Orders */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
            Month Orders
          </div>
          <div className="text-3xl font-black text-stone-900 mt-1.5">
            {report?.totalMonthOrders ?? 0}
          </div>
          <div className="text-xs font-semibold text-stone-500 mt-1 flex items-center gap-1">
            <ShoppingBag className="w-3.5 h-3.5 text-stone-400" />
            <span>Orders served at tables</span>
          </div>
        </div>

        {/* Dishes Sold & Top Seller */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
            Dishes Sold
          </div>
          <div className="text-3xl font-black text-stone-900 mt-1.5">
            {report?.totalMonthItems ?? 0}
          </div>
          <div className="text-xs font-semibold text-amber-700 mt-1 flex items-center gap-1 truncate" title={report?.topSellingDish}>
            <Award className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span className="truncate">Top: {report?.topSellingDish || 'None yet'}</span>
          </div>
        </div>
      </div>

      {/* Days List (1 to 30/31) */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xs p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div>
            <h2 className="text-lg font-black text-stone-900">
              Daily Earnings Breakdown · {report?.monthName} {selectedYear}
            </h2>
            <p className="text-xs text-stone-500">
              Click on any date to drop down and inspect all dishes sold and table orders for that day
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (Object.keys(expandedDays).length > 0) {
                setExpandedDays({});
              } else {
                const all: Record<number, boolean> = {};
                report?.days.forEach((d) => {
                  if (d.totalSales > 0) all[d.day] = true;
                });
                setExpandedDays(all);
              }
            }}
            className="text-xs font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
          >
            {Object.keys(expandedDays).length > 0 ? 'Collapse All' : 'Expand Active Days'}
          </button>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-xs font-bold text-stone-400 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
            <span>Loading {report?.monthName || 'monthly'} report data...</span>
          </div>
        ) : !report || report.days.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-400">
            No report data available for this month.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {report.days.map((day) => {
              const isExpanded = Boolean(expandedDays[day.day]);
              const hasSales = day.totalSales > 0;
              const isToday =
                selectedYear === today.getFullYear() &&
                selectedMonth === today.getMonth() + 1 &&
                day.day === today.getDate();

              return (
                <div
                  key={day.day}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    hasSales
                      ? isExpanded
                        ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-xs bg-stone-50/40'
                        : 'border-stone-200 hover:border-amber-300 bg-white'
                      : 'border-stone-100 bg-stone-50/30 opacity-70 hover:opacity-100'
                  }`}
                >
                  {/* Clickable Day Row Header */}
                  <button
                    type="button"
                    onClick={() => toggleDayExpansion(day.day)}
                    className="w-full p-4 flex items-center justify-between gap-3 text-left cursor-pointer transition-colors hover:bg-stone-50/80"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Day Number Box */}
                      <div
                        className={`w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center flex-shrink-0 shadow-2xs ${
                          isToday
                            ? 'bg-amber-600 text-white ring-2 ring-amber-600/30'
                            : hasSales
                            ? 'bg-stone-900 text-white'
                            : 'bg-stone-100 text-stone-400'
                        }`}
                      >
                        {day.day}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-stone-900 text-sm truncate">
                            {day.dateStr}
                          </h3>
                          <span className="text-[11px] font-bold text-stone-400">
                            ({day.dayOfWeek})
                          </span>
                          {isToday && (
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                              Today
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          {hasSales
                            ? `${day.ordersCount} orders placed · ${day.itemsCount} dishes sold`
                            : 'No orders recorded on this date'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      {/* Day Total */}
                      <div className="text-right">
                        <span
                          className={`text-base font-black ${
                            hasSales ? 'text-emerald-700' : 'text-stone-300'
                          }`}
                        >
                          ₹{day.totalSales}
                        </span>
                      </div>

                      <div className="p-1 text-stone-400">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-stone-700" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Dropdown Detail Panel (Items Sold & Orders Breakdown) */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-stone-200/80 bg-white p-5 flex flex-col gap-5"
                      >
                        {!hasSales ? (
                          <div className="py-4 text-center text-xs text-stone-400 italic">
                            No menu items were ordered on this date.
                          </div>
                        ) : (
                          <>
                            {/* 1. Sold Items Breakdown Table */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-black text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                                  <Utensils className="w-3.5 h-3.5 text-amber-600" />
                                  Items Sold on {day.dateStr} ({day.itemsSold.length} varieties)
                                </h4>
                                <span className="text-[11px] text-stone-500 font-semibold">
                                  Total {day.itemsCount} portions
                                </span>
                              </div>

                              <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-stone-50/50">
                                <table className="w-full text-xs text-left">
                                  <thead className="bg-stone-100/80 text-[10px] uppercase font-bold text-stone-500 border-b border-stone-200">
                                    <tr>
                                      <th className="py-2.5 px-3">Item Name</th>
                                      <th className="py-2.5 px-3 text-center">Quantity Sold</th>
                                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                                      <th className="py-2.5 px-3 text-right">Total Revenue</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-stone-200/60 font-medium text-stone-700">
                                    {day.itemsSold.map((it, idx) => (
                                      <tr key={idx} className="hover:bg-amber-50/30 transition-colors">
                                        <td className="py-2.5 px-3">
                                          <div className="flex items-center gap-2">
                                            <span
                                              className={`w-2.5 h-2.5 rounded-xs border flex items-center justify-center flex-shrink-0 ${
                                                it.vegType === 'nonveg'
                                                  ? 'border-red-600'
                                                  : 'border-emerald-600'
                                              }`}
                                            >
                                              <span
                                                className={`w-1 h-1 rounded-full ${
                                                  it.vegType === 'nonveg' ? 'bg-red-600' : 'bg-emerald-600'
                                                }`}
                                              />
                                            </span>
                                            <span className="font-bold text-stone-900">{it.name}</span>
                                          </div>
                                        </td>
                                        <td className="py-2.5 px-3 text-center">
                                          <span className="px-2 py-0.5 rounded-md bg-stone-200/70 font-black text-stone-900">
                                            {it.quantity}x
                                          </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-right text-stone-600">
                                          ₹{it.price}
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-black text-emerald-800">
                                          ₹{it.totalRevenue}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* 2. Individual Orders List */}
                            <div>
                              <h4 className="text-xs font-black text-stone-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                                Individual Table Orders ({day.orders.length})
                              </h4>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {day.orders.map((ord) => (
                                  <div
                                    key={ord._id}
                                    className="p-3.5 rounded-xl border border-stone-200 bg-white shadow-2xs flex flex-col justify-between gap-2"
                                  >
                                    <div>
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-black text-xs text-stone-900">
                                            {ord.orderNumber}
                                          </span>
                                          <span className="px-1.5 py-0.5 rounded bg-stone-100 font-bold text-[10px] text-stone-700">
                                            {ord.tableNumber}
                                          </span>
                                        </div>
                                        <span className="text-xs font-black text-emerald-700">
                                          ₹{ord.totalAmount}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-1">
                                        <span className="flex items-center gap-0.5">
                                          <User className="w-2.5 h-2.5" />
                                          {ord.customerName}
                                        </span>
                                        <span>•</span>
                                        <span className="flex items-center gap-0.5">
                                          <Clock className="w-2.5 h-2.5" />
                                          {ord.time}
                                        </span>
                                      </div>

                                      {/* Order Items list */}
                                      <div className="mt-2.5 pt-2 border-t border-stone-100 flex flex-wrap gap-1 text-[11px]">
                                        {ord.items.map((it, i) => (
                                          <span
                                            key={i}
                                            className="px-2 py-0.5 rounded bg-stone-50 border border-stone-200/80 font-medium text-stone-800"
                                          >
                                            {it.quantity}x {it.name}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
