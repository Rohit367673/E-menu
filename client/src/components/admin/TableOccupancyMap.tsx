import { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  ChefHat,
  Clock,
  Utensils,
  Plus,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import type { Order } from '../../types/menu';

interface TableOccupancyMapProps {
  orders: Order[];
  userRole?: 'admin' | 'manager';
  onTakeOrder: (tableNumber: string) => void;
  onViewTable?: (tableNumber: string) => void;
}

const DEFAULT_TABLES = [
  'Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5',
  'Table 6', 'Table 7', 'Table 8', 'Table 9', 'Table 10',
  'Bar 1', 'Bar 2',
];

export default function TableOccupancyMap({
  orders,
  userRole = 'admin',
  onTakeOrder,
  onViewTable,
}: TableOccupancyMapProps) {
  // Collect active orders (pending, preparing, served)
  const activeOrders = useMemo(() => {
    return orders.filter((o) => ['pending', 'preparing', 'served'].includes(o.status));
  }, [orders]);

  // Group active orders by table
  const tableOccupancyData = useMemo(() => {
    // Collect all table names (default tables + any custom active tables)
    const activeTableNames = Array.from(new Set(activeOrders.map((o) => o.tableNumber)));
    const allTableNames = Array.from(new Set([...DEFAULT_TABLES, ...activeTableNames]));

    // Sort cleanly
    allTableNames.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 999;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 999;
      if (a.startsWith('Table') && b.startsWith('Table')) return numA - numB;
      if (a.startsWith('Table')) return -1;
      if (b.startsWith('Table')) return 1;
      return a.localeCompare(b);
    });

    return allTableNames.map((tableName) => {
      const tableOrders = activeOrders.filter((o) => o.tableNumber === tableName);
      const isBooked = tableOrders.length > 0;

      let highestStatus: 'pending' | 'preparing' | 'served' | 'none' = 'none';
      if (tableOrders.some((o) => o.status === 'pending')) {
        highestStatus = 'pending';
      } else if (tableOrders.some((o) => o.status === 'preparing')) {
        highestStatus = 'preparing';
      } else if (tableOrders.some((o) => o.status === 'served')) {
        highestStatus = 'served';
      }

      const totalItems = tableOrders.reduce((sum, o) => sum + o.totalItems, 0);
      const totalBill = tableOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const guestName = tableOrders[0]?.customerName || 'Guest';
      const roundsCount = tableOrders.length;
      const earliestOrder = tableOrders[0]?.createdAt;

      // Elapsed minutes
      let elapsedMins = 0;
      if (earliestOrder) {
        elapsedMins = Math.max(0, Math.floor((Date.now() - new Date(earliestOrder).getTime()) / 60000));
      }

      return {
        tableNumber: tableName,
        isBooked,
        highestStatus,
        totalItems,
        totalBill,
        guestName,
        roundsCount,
        elapsedMins,
        orders: tableOrders,
      };
    });
  }, [activeOrders]);

  const bookedCount = tableOccupancyData.filter((t) => t.isBooked).length;
  const totalCount = tableOccupancyData.length;
  const occupancyPercent = totalCount > 0 ? Math.round((bookedCount / totalCount) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-black text-stone-900 tracking-tight">
              Table Occupancy Map
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-stone-900 text-white shadow-xs">
              {bookedCount} / {totalCount} Booked ({occupancyPercent}%)
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Real-time visual floor plan — Red for Booked (Occupied) tables, Green for Available
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span>Red = Booked ({bookedCount})</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Green = Available ({totalCount - bookedCount})</span>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tableOccupancyData.map((table) => {
          if (table.isBooked) {
            // BOOKED TABLE (RED)
            return (
              <motion.div
                key={table.tableNumber}
                whileHover={{ y: -3 }}
                className="relative overflow-hidden rounded-2xl border-2 border-rose-500/80 bg-gradient-to-br from-rose-50/90 via-white to-rose-50/40 p-4 shadow-sm flex flex-col justify-between gap-3 group"
              >
                {/* Top Accent Strip */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500" />

                <div>
                  {/* Table Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                        <h3 className="font-black text-base text-rose-950">
                          {table.tableNumber}
                        </h3>
                      </div>
                      <p className="text-xs font-bold text-rose-900/80 mt-0.5 flex items-center gap-1">
                        <Users className="w-3 h-3 text-rose-600" />
                        {table.guestName}
                      </p>
                    </div>

                    {/* Booked Tag */}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-2xs">
                      Booked
                    </span>
                  </div>

                  {/* Status & Timing */}
                  <div className="mt-3 pt-2.5 border-t border-rose-200/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-rose-800 font-bold">
                      {table.highestStatus === 'pending' && (
                        <span className="flex items-center gap-1 text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md font-extrabold border border-amber-300 animate-pulse">
                          <Clock className="w-3 h-3" /> New Pending
                        </span>
                      )}
                      {table.highestStatus === 'preparing' && (
                        <span className="flex items-center gap-1 text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md font-bold border border-blue-200">
                          <ChefHat className="w-3 h-3" /> In Kitchen
                        </span>
                      )}
                      {table.highestStatus === 'served' && (
                        <span className="flex items-center gap-1 text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md font-bold border border-purple-200">
                          <Utensils className="w-3 h-3" /> Served
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-rose-700/80 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-rose-500" />
                      {table.elapsedMins}m dining
                    </span>
                  </div>

                  {/* Round & Items Summary */}
                  <div className="mt-2 text-xs flex items-center justify-between text-stone-600">
                    <span className="font-semibold text-[11px]">
                      Round {table.roundsCount} · {table.totalItems} dishes
                    </span>
                    {/* Financial privacy: Only display running bill to owner/admin */}
                    {userRole !== 'manager' ? (
                      <span className="font-black text-rose-950 text-sm">
                        ₹{table.totalBill}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                        Active Round
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-rose-200/60 flex items-center gap-1.5">
                  {onViewTable && (
                    <button
                      type="button"
                      onClick={() => onViewTable(table.tableNumber)}
                      className="flex-1 py-1.5 px-2 rounded-xl text-xs font-bold text-rose-900 bg-white border border-rose-300 hover:bg-rose-100/60 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>View Orders</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onTakeOrder(table.tableNumber)}
                    className="py-1.5 px-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                    title="Add another round to this table"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Dish</span>
                  </button>
                </div>
              </motion.div>
            );
          }

          // AVAILABLE TABLE (GREEN)
          return (
            <motion.div
              key={table.tableNumber}
              whileHover={{ y: -3 }}
              className="relative overflow-hidden rounded-2xl border-2 border-emerald-400/70 bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/20 p-4 shadow-sm flex flex-col justify-between gap-3 group hover:border-emerald-500 transition-all"
            >
              {/* Top Accent Strip */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500" />

              <div>
                {/* Table Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <h3 className="font-black text-base text-stone-900">
                        {table.tableNumber}
                      </h3>
                    </div>
                    <p className="text-xs font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Vacant & Ready
                    </p>
                  </div>

                  {/* Available Tag */}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Available
                  </span>
                </div>

                {/* Subtext */}
                <p className="text-[11px] text-stone-500 mt-3.5 leading-relaxed">
                  Clean table. Customers can scan QR code or manager can take walk-in order.
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-emerald-200/50">
                <button
                  type="button"
                  onClick={() => onTakeOrder(table.tableNumber)}
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold text-emerald-900 bg-emerald-100/70 border border-emerald-300 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer group-hover:shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Book / Take Order</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
