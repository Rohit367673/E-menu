import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChefHat, CheckCircle2, ChevronRight, Sparkles, X, Receipt, BellRing } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import BillReceiptModal from '../common/BillReceiptModal';

interface LiveOrderStatusBannerProps {
  primaryColor?: string;
  headingFont?: string;
  restaurantName?: string;
}

export default function LiveOrderStatusBanner({
  primaryColor = '#6366f1',
  headingFont,
  restaurantName = 'Sukoon Cafe & Bar',
}: LiveOrderStatusBannerProps) {
  const {
    tableNumber,
    customerName,
    activeOrders,
    activeTableBill,
    activeRoundsCount,
    overallStatus,
    isTableSettled,
    settledOrders,
    settledTableBill,
    dismissSettledNotification,
    resetTableSession,
    setIsDrawerOpen,
    billRequested,
  } = useCart();

  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

const cleanTableNumber = (tbl?: string) => {
  if (!tbl) return '';
  return tbl.replace(/^table\s*/i, '').trim();
};

  // If table has been settled by receptionist
  if (isTableSettled) {
    const cleanedTable = cleanTableNumber(tableNumber);
    return (
      <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="max-w-5xl mx-auto px-4 sm:px-6 my-2"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/30 shadow-xs">
          <div className="flex items-center justify-between sm:justify-start gap-2.5 min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md flex-shrink-0">
                    Table {cleanedTable}
                  </span>
                  <span className="text-xs font-bold text-emerald-900 flex-shrink-0">Bill Settled ✓</span>
                </div>
                <p className="text-xs text-emerald-700 truncate mt-0.5">
                  Thank you for visiting {restaurantName}!
                </p>
              </div>
            </div>
            {/* Mobile dismiss button */}
            <button
              type="button"
              onClick={dismissSettledNotification}
              className="sm:hidden p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer flex-shrink-0"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t border-emerald-500/20 sm:border-t-0 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsReceiptOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-xl bg-white text-emerald-800 border border-emerald-300 text-xs font-bold transition-all shadow-2xs hover:bg-emerald-50 cursor-pointer active:scale-98"
              title="View settled bill receipt"
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-700" />
              <span>Receipt</span>
            </button>
            <button
              type="button"
              onClick={() => {
                resetTableSession();
                dismissSettledNotification();
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center px-3.5 py-2 sm:py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
            >
              Start New Order
            </button>
            {/* Desktop dismiss button */}
            <button
              type="button"
              onClick={dismissSettledNotification}
              className="hidden sm:inline-flex p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer flex-shrink-0"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      <BillReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        tableNumber={cleanedTable}
        customerName={customerName || settledOrders[0]?.customerName || 'Guest'}
        orders={settledOrders.length > 0 ? settledOrders : activeOrders}
        totalBill={settledTableBill > 0 ? settledTableBill : activeTableBill}
        restaurantName={restaurantName}
        isSettled={true}
      />
      </>
    );
  }

  // If table has active ongoing orders
  if (activeOrders.length === 0) return null;

  const latestOrder = activeOrders[activeOrders.length - 1];

  const statusConfig = {
    pending: {
      label: 'Preparing Order',
      subtext: 'Chef is preparing your fresh dishes',
      icon: ChefHat,
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
      pillBg: 'from-amber-500/10 to-orange-500/10 border-amber-500/30',
      accentColor: '#d97706',
    },
    preparing: {
      label: 'Preparing Order',
      subtext: 'Chef is preparing your fresh dishes',
      icon: ChefHat,
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
      pillBg: 'from-amber-500/10 to-orange-500/10 border-amber-500/30',
      accentColor: '#d97706',
    },
    served: {
      label: 'Served (Complete)',
      subtext: 'Dishes served at your table · Enjoy your meal!',
      icon: CheckCircle2,
      badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      pillBg: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/30',
      accentColor: '#059669',
    },
    completed: {
      label: 'Served (Complete)',
      subtext: 'Dishes served · Table settled',
      icon: CheckCircle2,
      badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      pillBg: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/30',
      accentColor: '#059669',
    },
    cancelled: {
      label: 'Cancelled',
      subtext: 'Order was cancelled',
      icon: X,
      badgeBg: 'bg-red-100 text-red-900 border-red-300',
      pillBg: 'from-red-500/10 to-red-500/10 border-red-500/30',
      accentColor: '#dc2626',
    },
  };

  const isBillReq = billRequested || activeOrders.some((o) => o.billRequested);
  const status = overallStatus !== 'none' ? overallStatus : (latestOrder?.status || 'pending');
  const baseCfg = statusConfig[status] || statusConfig.pending;
  const rawTable = tableNumber || latestOrder?.tableNumber || '';
  const cleanedTable = cleanTableNumber(rawTable);
  const cfg = isBillReq
    ? {
        ...baseCfg,
        label: 'Bill Requested',
        subtext: 'Waiter has been notified · Bringing your bill to Table ' + cleanedTable,
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
        pillBg: 'from-amber-500/15 via-orange-500/10 to-amber-500/15 border-amber-400',
        accentColor: '#d97706',
        icon: BellRing,
      }
    : baseCfg;
  const Icon = cfg.icon;

  return (
    <>
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="max-w-5xl mx-auto px-4 sm:px-6 my-2.5"
      >
        <div
          onClick={() => setIsDrawerOpen(true)}
          className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r ${cfg.pillBg} border shadow-xs cursor-pointer hover:shadow-md transition-all active:scale-[0.99]`}
        >
          {/* Top Row on Mobile / Left Column on Desktop */}
          <div className="flex items-start sm:items-center justify-between gap-2.5 sm:gap-3 min-w-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-xs"
                style={{ backgroundColor: cfg.accentColor }}
              >
                <Icon className={`w-5 h-5 ${status === 'preparing' ? 'animate-bounce' : status === 'pending' ? 'animate-pulse' : isBillReq ? 'animate-bounce' : ''}`} />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/95 border border-black/10 text-gray-900 shadow-2xs flex-shrink-0">
                    Table {cleanedTable}
                  </span>
                  <span className={`text-[11px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-md border ${cfg.badgeBg} flex-shrink-0`}>
                    {cfg.label}
                  </span>
                  <span className="text-[11px] font-medium text-gray-500">
                    • Round {latestOrder?.round || activeRoundsCount || 1}
                  </span>
                </div>
                <p className="text-xs text-gray-600 truncate mt-0.5">
                  {cfg.subtext}
                </p>
              </div>
            </div>

            {/* Mobile-only Running Bill on top right */}
            <div className="sm:hidden text-right flex-shrink-0 pl-1">
              <span className="text-[9px] uppercase font-bold tracking-wider text-gray-500 block leading-tight">
                Total
              </span>
              <span
                className="text-sm font-black text-gray-900"
                style={{ fontFamily: headingFont }}
              >
                ₹{activeTableBill}
              </span>
            </div>
          </div>

          {/* Action Row: Mobile Bottom Strip / Desktop Right Side */}
          <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t border-black/5 sm:border-t-0 flex-shrink-0 justify-between sm:justify-end">
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              {/* View Bill Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsReceiptOpen(true);
                }}
                className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-stone-800 border border-black/10 text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95 flex-shrink-0"
                title="View & Print Itemized Bill Receipt"
              >
                <Receipt className="w-3.5 h-3.5 text-amber-600" />
                <span>Bill Receipt</span>
              </button>
            </div>

            {/* Desktop-only Running Bill Display */}
            <div className="hidden sm:block text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block leading-none">
                Running Bill
              </span>
              <span
                className="text-base font-black text-gray-900"
                style={{ fontFamily: headingFont }}
              >
                ₹{activeTableBill}
              </span>
            </div>

            {/* Chevron button */}
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-transform group-hover:translate-x-0.5 shadow-xs flex-shrink-0"
              style={{ backgroundColor: primaryColor }}
              title="View full order details"
            >
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>

    {/* Customer Bill Receipt Modal */}
    <BillReceiptModal
      isOpen={isReceiptOpen}
      onClose={() => setIsReceiptOpen(false)}
      tableNumber={cleanedTable}
      customerName={customerName || latestOrder?.customerName || settledOrders[0]?.customerName || 'Guest'}
      orders={activeOrders.length > 0 ? activeOrders : settledOrders}
      totalBill={activeTableBill > 0 ? activeTableBill : settledTableBill}
      restaurantName={restaurantName}
      isSettled={overallStatus === 'completed' || isTableSettled}
    />
    </>
  );
}
