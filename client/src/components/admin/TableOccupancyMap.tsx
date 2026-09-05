import { useState, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import {
  ChefHat,
  CheckCircle2,
  Plus,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Columns,
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
 * Top-down architectural cafe dining table SVG with 4 chairs and place setting (Enlarged & Sharp)
 */
function CafeTableSVG({ isBooked }: { isBooked: boolean }) {
  if (isBooked) {
    return (
      <svg
        viewBox="0 0 64 64"
        className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 transition-transform duration-200 group-hover:scale-105 drop-shadow-xs"
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
        <rect x="14" y="14" width="36" height="36" rx="9" fill="#ffe4e6" stroke="#f43f5e" strokeWidth="2.2" />
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
      className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 transition-transform duration-200 group-hover:scale-105 drop-shadow-xs"
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
      <rect x="14" y="14" width="36" height="36" rx="9" fill="#d1fae5" stroke="#10b981" strokeWidth="2.2" />
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
  const [viewMode, setViewMode] = useState<'track' | 'grid'>('track');

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

      let highestStatus: 'preparing' | 'served' | 'none' = 'none';
      if (tableOrders.some((o) => o.status === 'preparing' || o.status === 'pending')) {
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
      scrollContainerRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-3xl border border-stone-200 shadow-2xs flex flex-col gap-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
              Table Floor Map
            </h3>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
              {totalCount} Tables
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Red for Occupied · Green for Available · Tap any table to order
          </p>
        </div>

        {/* Status Indicators & View Mode Switcher */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
          <span className="px-3 py-1 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1.5 shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span>{bookedCount} Booked</span>
          </span>

          <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>{availableCount} Available</span>
          </span>

          {/* View Mode Switcher (Track vs Grid) */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-bold ml-auto sm:ml-0">
            <button
              type="button"
              onClick={() => setViewMode('track')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'track'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Horizontal scroll track"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Track</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Full floor grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Grid</span>
            </button>
          </div>

          {/* Scroll arrow buttons (Track mode only) */}
          {viewMode === 'track' && (
            <div className="hidden sm:flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
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
          )}
        </div>
      </div>

      {/* Tables Container (Track Scroll or Full Grid) */}
      <div
        ref={scrollContainerRef}
        className={
          viewMode === 'track'
            ? 'overflow-x-auto flex items-center gap-3.5 pb-3 pt-1 scroll-smooth scrollbar-thin select-none touch-pan-x'
            : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5 pt-1'
        }
      >
        {tableOccupancyData.map((table) => {
          if (table.isBooked) {
            // BOOKED TABLE (LARGE RED BOX WITH ARCHITECTURAL CAFE TABLE SVG)
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
                className={`group p-3.5 sm:p-4 rounded-3xl bg-gradient-to-b from-rose-500/10 via-rose-500/5 to-rose-500/15 border-2 border-rose-500/80 hover:border-rose-600 hover:shadow-md transition-all flex flex-col justify-between items-center text-center cursor-pointer shadow-2xs relative ${
                  viewMode === 'track'
                    ? 'min-w-[170px] max-w-[170px] sm:min-w-[195px] sm:max-w-[195px] h-[225px] sm:h-[240px] flex-shrink-0'
                    : 'w-full h-[225px] sm:h-[240px]'
                }`}
              >
                {/* Top: Table name & Live dot & Round */}
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse flex-shrink-0" />
                    <span className="font-black text-sm sm:text-base text-rose-950 truncate">
                      {table.tableNumber}
                    </span>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-rose-600 text-white flex-shrink-0 shadow-2xs">
                    R{table.roundsCount}
                  </span>
                </div>

                {/* Center: Large Cafe Table SVG Illustration & Guest Details */}
                <div className="flex flex-col items-center my-auto w-full gap-1.5">
                  <CafeTableSVG isBooked={true} />
                  <span className="text-xs sm:text-sm font-extrabold text-rose-950 truncate max-w-[145px] leading-tight">
                    {table.guestName}
                  </span>

                  <div>
                    {table.highestStatus === 'preparing' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse flex items-center gap-1 shadow-2xs">
                        <ChefHat className="w-3 h-3 text-amber-700" /> Preparing
                      </span>
                    )}
                    {table.highestStatus === 'served' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 shadow-2xs">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Served
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom: Elapsed time & View button */}
                <div className="w-full flex items-center justify-between pt-2 border-t border-rose-200/70 text-[11px] text-rose-800 font-semibold">
                  <span>{table.elapsedMins}m dining</span>
                  <span className="font-extrabold flex items-center gap-0.5 text-rose-900 hover:text-rose-700 bg-rose-200/60 px-2 py-0.5 rounded-md">
                    Orders <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </motion.div>
            );
          }

          // AVAILABLE TABLE (LARGE GREEN BOX WITH ARCHITECTURAL CAFE TABLE SVG)
          return (
            <motion.div
              key={table.tableNumber}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onTakeOrder(table.tableNumber)}
              className={`group p-3.5 sm:p-4 rounded-3xl bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-emerald-500/15 border-2 border-emerald-500/80 hover:border-emerald-600 hover:shadow-md transition-all flex flex-col justify-between items-center text-center cursor-pointer shadow-2xs relative ${
                viewMode === 'track'
                  ? 'min-w-[170px] max-w-[170px] sm:min-w-[195px] sm:max-w-[195px] h-[225px] sm:h-[240px] flex-shrink-0'
                  : 'w-full h-[225px] sm:h-[240px]'
              }`}
            >
              {/* Top: Table name & Free dot */}
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span className="font-black text-sm sm:text-base text-stone-900 truncate">
                    {table.tableNumber}
                  </span>
                </div>
                <span className="w-2.5" />
              </div>

              {/* Center: Large Cafe Table SVG Illustration & Available label */}
              <div className="flex flex-col items-center my-auto gap-1.5">
                <CafeTableSVG isBooked={false} />
                <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider bg-emerald-100/90 border border-emerald-300 px-2.5 py-0.5 rounded-full shadow-2xs">
                  Available
                </span>
              </div>

              {/* Bottom: Book action button */}
              <div className="w-full pt-2 border-t border-emerald-200/70">
                <div className="w-full py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-xs group-hover:scale-102">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Book Table</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
