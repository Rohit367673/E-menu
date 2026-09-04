import { useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import {
  ChefHat,
  Clock,
  Utensils,
  Plus,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
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
  onTakeOrder,
  onViewTable,
}: TableOccupancyMapProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Collect active orders (pending, preparing, served)
  const activeOrders = useMemo(() => {
    return orders.filter((o) => ['pending', 'preparing', 'served'].includes(o.status));
  }, [orders]);

  // Group active orders by table
  const tableOccupancyData = useMemo(() => {
    const activeTableNames = Array.from(new Set(activeOrders.map((o) => o.tableNumber)));
    const allTableNames = Array.from(new Set([...DEFAULT_TABLES, ...activeTableNames]));

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

      const guestName = tableOrders[0]?.customerName || 'Guest';
      const roundsCount = tableOrders.length;
      const earliestOrder = tableOrders[0]?.createdAt;

      let elapsedMins = 0;
      if (earliestOrder) {
        elapsedMins = Math.max(
          0,
          Math.floor((Date.now() - new Date(earliestOrder).getTime()) / 60000)
        );
      }

      return {
        tableNumber: tableName,
        isBooked,
        highestStatus,
        guestName,
        roundsCount,
        elapsedMins,
      };
    });
  }, [activeOrders]);

  const bookedCount = tableOccupancyData.filter((t) => t.isBooked).length;
  const totalCount = tableOccupancyData.length;
  const availableCount = totalCount - bookedCount;

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -260, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 260, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs flex flex-col gap-3.5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-stone-900 tracking-tight">
              Table Floor Map
            </h3>
            <span className="text-xs font-bold text-stone-400">
              ({totalCount} Tables)
            </span>
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Side-scroll floor map · Red for Occupied, Green for Available
          </p>
        </div>

        {/* Status Indicators & Scroll Buttons */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
          <span className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>{bookedCount} Booked</span>
          </span>

          <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{availableCount} Available</span>
          </span>

          {/* Scroll arrow buttons */}
          <div className="hidden sm:flex items-center gap-1 ml-1 bg-stone-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={scrollLeft}
              className="p-1 rounded-lg hover:bg-white text-stone-600 transition-colors cursor-pointer"
              title="Scroll Left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={scrollRight}
              className="p-1 rounded-lg hover:bg-white text-stone-600 transition-colors cursor-pointer"
              title="Scroll Right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Side-Scroll Floor Track */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto flex items-center gap-3 pb-2 pt-1 scroll-smooth scrollbar-thin select-none"
      >
        {tableOccupancyData.map((table) => {
          if (table.isBooked) {
            // BOOKED TABLE (RED BOX)
            return (
              <motion.div
                key={table.tableNumber}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (onViewTable) {
                    onViewTable(table.tableNumber);
                  } else {
                    onTakeOrder(table.tableNumber);
                  }
                }}
                className="min-w-[125px] max-w-[125px] sm:min-w-[135px] sm:max-w-[135px] h-32 p-3 rounded-2xl bg-rose-500/10 border-2 border-rose-500/80 hover:border-rose-600 hover:bg-rose-500/20 transition-all flex flex-col justify-between items-center text-center cursor-pointer shadow-2xs relative flex-shrink-0"
              >
                {/* Top: Table name & Live dot */}
                <div className="w-full flex items-center justify-between">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                  <span className="font-black text-xs text-rose-950 truncate max-w-[80px]">
                    {table.tableNumber}
                  </span>
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-600 text-white">
                    R{table.roundsCount}
                  </span>
                </div>

                {/* Center: Guest name & Kitchen status */}
                <div className="flex flex-col items-center my-auto w-full">
                  <span className="text-xs font-bold text-rose-900 truncate max-w-[105px]">
                    {table.guestName}
                  </span>

                  <div className="mt-1">
                    {table.highestStatus === 'preparing' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                        <ChefHat className="w-2.5 h-2.5" /> Prep
                      </span>
                    )}
                    {table.highestStatus === 'pending' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> New
                      </span>
                    )}
                    {table.highestStatus === 'served' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                        <Utensils className="w-2.5 h-2.5" /> Served
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom: Elapsed time & View button */}
                <div className="w-full flex items-center justify-between pt-1.5 border-t border-rose-200/60 text-[10px] text-rose-800 font-semibold">
                  <span>{table.elapsedMins}m</span>
                  <span className="font-bold underline flex items-center gap-0.5 text-rose-900 hover:text-rose-700">
                    Orders <ArrowUpRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </motion.div>
            );
          }

          // AVAILABLE TABLE (GREEN BOX)
          return (
            <motion.div
              key={table.tableNumber}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onTakeOrder(table.tableNumber)}
              className="min-w-[125px] max-w-[125px] sm:min-w-[135px] sm:max-w-[135px] h-32 p-3 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/80 hover:border-emerald-600 hover:bg-emerald-500/20 transition-all flex flex-col justify-between items-center text-center cursor-pointer shadow-2xs relative flex-shrink-0"
            >
              {/* Top: Table name & Free dot */}
              <div className="w-full flex items-center justify-between">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-black text-xs text-stone-900 truncate max-w-[80px]">
                  {table.tableNumber}
                </span>
                <span className="w-2" />
              </div>

              {/* Center: Cafe table icon & Free badge */}
              <div className="flex flex-col items-center my-auto">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-800 mb-1">
                  <Utensils className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                  Available
                </span>
              </div>

              {/* Bottom: Book action button */}
              <div className="w-full pt-1.5 border-t border-emerald-200/60 text-[10px] font-bold text-emerald-800 flex items-center justify-center gap-1 hover:text-emerald-950">
                <Plus className="w-3 h-3" />
                <span>Book Table</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
