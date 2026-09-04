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

// Cafe has dining tables only (no bar tables)
const DEFAULT_TABLES = [
  'Table 1',
  'Table 2',
  'Table 3',
  'Table 4',
  'Table 5',
  'Table 6',
  'Table 7',
  'Table 8',
  'Table 9',
  'Table 10',
];

/**
 * Normalizes any table input to standard "Table X" format
 * (e.g., "2" -> "Table 2", "table 2" -> "Table 2", "Table02" -> "Table 2")
 */
export const normalizeTableName = (raw: string | undefined | null): string => {
  if (!raw) return 'Table 1';
  const trimmed = String(raw).trim();
  if (/^\d+$/.test(trimmed)) {
    return `Table ${parseInt(trimmed, 10)}`;
  }
  const match = trimmed.match(/^table\s*(\d+)$/i);
  if (match) {
    return `Table ${parseInt(match[1], 10)}`;
  }
  return trimmed;
};

/**
 * Top-down architectural cafe dining table SVG with 4 chairs and place setting
 */
function CafeTableSVG({ isBooked }: { isBooked: boolean }) {
  if (isBooked) {
    return (
      <svg
        viewBox="0 0 64 64"
        className="w-11 h-11 flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Top Chair */}
        <rect x="22" y="3" width="20" height="6.5" rx="3.25" fill="#f43f5e" fillOpacity="0.85" />
        <rect x="25" y="7.5" width="14" height="2" rx="1" fill="#e11d48" />
        {/* Bottom Chair */}
        <rect x="22" y="54.5" width="20" height="6.5" rx="3.25" fill="#f43f5e" fillOpacity="0.85" />
        <rect x="25" y="54.5" width="14" height="2" rx="1" fill="#e11d48" />
        {/* Left Chair */}
        <rect x="3" y="22" width="6.5" height="20" rx="3.25" fill="#f43f5e" fillOpacity="0.85" />
        <rect x="7.5" y="25" width="2" height="14" rx="1" fill="#e11d48" />
        {/* Right Chair */}
        <rect x="54.5" y="22" width="6.5" height="20" rx="3.25" fill="#f43f5e" fillOpacity="0.85" />
        <rect x="54.5" y="25" width="2" height="14" rx="1" fill="#e11d48" />

        {/* Table Surface (Dining Table) */}
        <rect x="14" y="14" width="36" height="36" rx="9" fill="#ffe4e6" stroke="#f43f5e" strokeWidth="2" />
        <rect x="18" y="18" width="28" height="28" rx="6" fill="#fecdd3" fillOpacity="0.5" stroke="#fb7185" strokeWidth="1" strokeDasharray="2 2" />

        {/* Served Feast Dish Platter */}
        <circle cx="32" cy="32" r="7.5" fill="#ffffff" stroke="#e11d48" strokeWidth="1.5" />
        <circle cx="32" cy="32" r="4.5" fill="#f43f5e" fillOpacity="0.3" />
        {/* Dining Utensils */}
        <line x1="21" y1="28" x2="21" y2="36" stroke="#9f1239" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="43" y1="28" x2="43" y2="36" stroke="#9f1239" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  // Clean Available Cafe Table (Emerald)
  return (
    <svg
      viewBox="0 0 64 64"
      className="w-11 h-11 flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top Chair */}
      <rect x="22" y="3" width="20" height="6.5" rx="3.25" fill="#10b981" fillOpacity="0.85" />
      <rect x="25" y="7.5" width="14" height="2" rx="1" fill="#059669" />
      {/* Bottom Chair */}
      <rect x="22" y="54.5" width="20" height="6.5" rx="3.25" fill="#10b981" fillOpacity="0.85" />
      <rect x="25" y="54.5" width="14" height="2" rx="1" fill="#059669" />
      {/* Left Chair */}
      <rect x="3" y="22" width="6.5" height="20" rx="3.25" fill="#10b981" fillOpacity="0.85" />
      <rect x="7.5" y="25" width="2" height="14" rx="1" fill="#059669" />
      {/* Right Chair */}
      <rect x="54.5" y="22" width="6.5" height="20" rx="3.25" fill="#10b981" fillOpacity="0.85" />
      <rect x="54.5" y="25" width="2" height="14" rx="1" fill="#059669" />

      {/* Table Surface (Clean Ready Table) */}
      <rect x="14" y="14" width="36" height="36" rx="9" fill="#d1fae5" stroke="#10b981" strokeWidth="2" />
      <rect x="18" y="18" width="28" height="28" rx="6" fill="#a7f3d0" fillOpacity="0.35" stroke="#34d399" strokeWidth="1" strokeDasharray="2 2" />

      {/* Clean Place Setting */}
      <circle cx="32" cy="32" r="7.5" fill="#ffffff" stroke="#059669" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="4.5" fill="#10b981" fillOpacity="0.25" />
      {/* Cutlery */}
      <line x1="21" y1="28" x2="21" y2="36" stroke="#047857" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="43" y1="28" x2="43" y2="36" stroke="#047857" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

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

  // Group active orders by normalized table name (excluding any bar tables)
  const tableOccupancyData = useMemo(() => {
    const activeTableMap = new Map<string, Order[]>();

    for (const order of activeOrders) {
      const raw = order.tableNumber;
      const normalized = normalizeTableName(raw);
      // Cafe only has dining tables (filter out any bar entries)
      if (!normalized.toLowerCase().includes('bar')) {
        if (!activeTableMap.has(normalized)) {
          activeTableMap.set(normalized, []);
        }
        activeTableMap.get(normalized)!.push(order);
      }
    }

    const allTableNames = Array.from(
      new Set([
        ...DEFAULT_TABLES,
        ...Array.from(activeTableMap.keys()),
      ])
    ).filter((t) => !t.toLowerCase().includes('bar'));

    // Sort tables naturally (Table 1, Table 2, ... Table 10)
    allTableNames.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 999;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 999;
      if (a.startsWith('Table') && b.startsWith('Table')) return numA - numB;
      if (a.startsWith('Table')) return -1;
      if (b.startsWith('Table')) return 1;
      return a.localeCompare(b);
    });

    return allTableNames.map((tableName) => {
      const tableOrders = activeTableMap.get(tableName) || [];
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
            // BOOKED TABLE (RED BOX WITH CAFE TABLE SVG)
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
                className="group min-w-[136px] max-w-[136px] sm:min-w-[146px] sm:max-w-[146px] h-[158px] p-3 rounded-2xl bg-rose-500/10 border-2 border-rose-500/80 hover:border-rose-600 hover:bg-rose-500/20 transition-all flex flex-col justify-between items-center text-center cursor-pointer shadow-2xs relative flex-shrink-0"
              >
                {/* Top: Table name & Live dot & Round */}
                <div className="w-full flex items-center justify-between">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse flex-shrink-0" />
                  <span className="font-black text-xs text-rose-950 truncate max-w-[85px]">
                    {table.tableNumber}
                  </span>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-600 text-white flex-shrink-0">
                    R{table.roundsCount}
                  </span>
                </div>

                {/* Center: Cafe Table SVG Illustration & Guest Details */}
                <div className="flex flex-col items-center my-auto w-full gap-1">
                  <CafeTableSVG isBooked={true} />
                  <span className="text-xs font-bold text-rose-900 truncate max-w-[115px] leading-tight">
                    {table.guestName}
                  </span>

                  <div>
                    {table.highestStatus === 'preparing' && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                        <ChefHat className="w-2.5 h-2.5" /> Kitchen
                      </span>
                    )}
                    {table.highestStatus === 'pending' && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> New Order
                      </span>
                    )}
                    {table.highestStatus === 'served' && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
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

          // AVAILABLE TABLE (GREEN BOX WITH CAFE TABLE SVG)
          return (
            <motion.div
              key={table.tableNumber}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onTakeOrder(table.tableNumber)}
              className="group min-w-[136px] max-w-[136px] sm:min-w-[146px] sm:max-w-[146px] h-[158px] p-3 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/80 hover:border-emerald-600 hover:bg-emerald-500/20 transition-all flex flex-col justify-between items-center text-center cursor-pointer shadow-2xs relative flex-shrink-0"
            >
              {/* Top: Table name & Free dot */}
              <div className="w-full flex items-center justify-between">
                <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="font-black text-xs text-stone-900 truncate max-w-[85px]">
                  {table.tableNumber}
                </span>
                <span className="w-2" />
              </div>

              {/* Center: Cafe Table SVG Illustration & Available label */}
              <div className="flex flex-col items-center my-auto gap-1">
                <CafeTableSVG isBooked={false} />
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                  Available
                </span>
              </div>

              {/* Bottom: Book action button */}
              <div className="w-full pt-1.5 border-t border-emerald-200/60 text-[10px] font-bold text-emerald-800 flex items-center justify-center gap-1 group-hover:text-emerald-950">
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
