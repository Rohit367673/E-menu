import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ChefHat, ArrowRight } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

interface FloatingOrderBarProps {
  primaryColor?: string;
  headingFont?: string;
}

export default function FloatingOrderBar({
  primaryColor = '#8B5E3C',
  headingFont = 'Playfair Display',
}: FloatingOrderBarProps) {
  const {
    totalItems,
    totalPrice,
    setIsDrawerOpen,
    activeOrders,
    activeTableBill,
    tableNumber,
    overallStatus,
    billRequested,
  } = useCart();

  const cleanTableNumber = (tbl?: string) => {
    if (!tbl) return '';
    return tbl.replace(/^table\s*/i, '').trim();
  };

  const hasCartItems = totalItems > 0;
  const hasActiveOrders = activeOrders.length > 0;

  if (!hasCartItems && !hasActiveOrders) return null;

  const isBillReq = billRequested || activeOrders.some((o) => o.billRequested);
  const cleanedTable = cleanTableNumber(tableNumber);
  const tableLabel = cleanedTable ? `Table ${cleanedTable}` : 'Your Table';

  let statusLabel = `${activeOrders.length} Round${activeOrders.length > 1 ? 's' : ''} in Kitchen`;
  if (isBillReq) {
    statusLabel = 'Bill Requested';
  } else if (overallStatus === 'served' || overallStatus === 'completed') {
    statusLabel = 'Dishes Served ✓';
  } else if (overallStatus === 'preparing') {
    statusLabel = 'Cooking in Kitchen';
  }

  return (
    <div className="fixed bottom-4 inset-x-0 z-40 px-4 pointer-events-none flex flex-col items-center gap-2 max-w-lg mx-auto">
      {/* Active Table Status Pill (Flow Ordering Status) */}
      <AnimatePresence>
        {hasActiveOrders && !hasCartItems && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            onClick={() => setIsDrawerOpen(true)}
            className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-2.5 rounded-full bg-[#2C1810]/95 text-white shadow-xl backdrop-blur-md border border-amber-500/30 text-xs w-full max-w-sm cursor-pointer hover:bg-[#2C1810] transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-2 h-2 rounded-full ${overallStatus === 'served' ? 'bg-emerald-400' : 'bg-amber-400'} animate-ping flex-shrink-0`} />
              <ChefHat className={`w-4 h-4 ${overallStatus === 'served' ? 'text-emerald-400' : 'text-amber-400'} flex-shrink-0`} />
              <span className="font-semibold truncate">
                {tableLabel}: {statusLabel}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-amber-400 flex-shrink-0">
              <span>₹{activeTableBill}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Cart Order Bar */}
      <AnimatePresence>
        {hasCartItems && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="pointer-events-auto w-full shadow-2xl rounded-2xl p-1 bg-gradient-to-r from-amber-600 via-amber-700 to-stone-800"
          >
            <div className="bg-[#1f1610]/95 backdrop-blur-md rounded-[14px] px-4 py-3 flex items-center justify-between gap-3 border border-amber-500/25">
              {/* Left: Cart Info */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md relative flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, #a86c3d)` }}
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-stone-900 font-bold text-[11px] flex items-center justify-center border-2 border-[#1f1610]">
                    {totalItems}
                  </span>
                </div>

                <div className="flex flex-col text-left">
                  <span className="text-[11px] text-amber-200/75 uppercase tracking-wider font-semibold">
                    {cleanedTable ? `Table ${cleanedTable} Order` : 'Tableside Order'}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-white text-base font-extrabold tracking-tight" style={{ fontFamily: headingFont }}>
                      ₹{totalPrice}
                    </span>
                    <span className="text-stone-400 text-[11px]">
                      ({totalItems} {totalItems === 1 ? 'dish' : 'dishes'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Checkout CTA */}
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-stone-950 shadow-md cursor-pointer transition-all hover:brightness-110 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
                }}
              >
                <span>View Order</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
