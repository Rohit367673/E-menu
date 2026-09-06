import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Printer, X, RotateCcw } from 'lucide-react';

interface KOTTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  kotNumber: string;
  tableNumber: string;
  round: number;
  orderNumber: string;
  customerName: string;
  time: string;
  items: Array<{ name: string; quantity: number; notes?: string }>;
  specialInstructions?: string;
  autoPrint?: boolean;
}

export default function KOTTicketModal({
  isOpen,
  onClose,
  kotNumber,
  tableNumber,
  round,
  orderNumber,
  customerName,
  time,
  items,
  specialInstructions,
  autoPrint = false,
}: KOTTicketModalProps) {
  const hasPrintedRef = useRef(false);

  useEffect(() => {
    if (isOpen && autoPrint && !hasPrintedRef.current) {
      hasPrintedRef.current = true;
      // Small delay to let the DOM render
      const timer = setTimeout(() => {
        handlePrint();
      }, 400);
      return () => clearTimeout(timer);
    }
    if (!isOpen) {
      hasPrintedRef.current = false;
    }
  }, [isOpen, autoPrint]);

  if (!isOpen) return null;

  const handlePrint = () => {
    document.body.classList.add('printing-kot');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-kot');
    }, 1000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-sm bg-stone-100 rounded-3xl shadow-2xl border border-stone-300 z-10 my-auto overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-stone-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-xs">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-stone-900 tracking-tight">
                  Kitchen Order Ticket
                </h3>
                <p className="text-[11px] text-stone-500 font-medium">
                  {kotNumber} · Table {tableNumber} · Round {round}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* KOT Ticket Preview */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex justify-center bg-stone-100/70">
            <div
              id="kot-ticket-printable"
              className="w-full bg-white text-stone-900 rounded-xl p-5 shadow-md border border-stone-200/80 font-mono text-[13px] leading-relaxed"
              style={{ fontFamily: "'JetBrains Mono', 'Courier New', Courier, monospace" }}
            >
              {/* KOT Header */}
              <div className="text-center space-y-1 pb-3 border-b-2 border-dashed border-stone-300">
                <div className="text-lg font-black uppercase tracking-[0.2em] text-stone-900">
                  ★ K O T ★
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-stone-600">
                  Kitchen Order Ticket
                </div>
                <div className="text-[10px] text-stone-500">
                  Sukoon Cafe & Bar
                </div>
                <div className="mt-1 inline-block border border-stone-300 px-1.5 py-0.5 text-[9px] font-bold text-stone-600 rounded uppercase tracking-wider">
                  TVS Champ RP Star 80mm
                </div>
              </div>

              {/* Order Meta */}
              <div className="py-2.5 border-b border-dashed border-stone-300 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-500">KOT #:</span>
                  <span className="font-black text-stone-900">{kotNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Time:</span>
                  <span className="font-bold">{time}</span>
                </div>
                <div className="flex justify-between font-black text-stone-900 pt-0.5 text-xs">
                  <span className="bg-stone-100 px-1.5 py-0.5 rounded">TABLE: {tableNumber}</span>
                  <span>ROUND: {round}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-stone-500">Order:</span>
                  <span className="font-bold">{orderNumber}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-stone-500">Guest:</span>
                  <span>{customerName}</span>
                </div>
              </div>

              {/* Items Header */}
              <div className="py-2 border-b-2 border-stone-800 text-xs font-black uppercase tracking-wider flex justify-between">
                <span className="flex-1">Item</span>
                <span className="w-12 text-right">Qty</span>
              </div>

              {/* Items — NO PRICES */}
              <div className="py-2 space-y-2 border-b-2 border-dashed border-stone-300">
                {items.map((it, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between items-start">
                      <span className="flex-1 font-bold text-sm text-stone-900 leading-tight kot-item-name">
                        {it.name}
                      </span>
                      <span className="w-12 text-right font-black text-base text-stone-900 kot-item-qty">
                        {it.quantity}x
                      </span>
                    </div>
                    {it.notes && (
                      <div className="text-[11px] text-amber-800 italic pl-2">
                        → {it.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Special Instructions */}
              {specialInstructions && (
                <div className="py-2 border-b border-dashed border-stone-300">
                  <div className="text-[11px] font-bold uppercase text-stone-600 mb-1">Special Instructions:</div>
                  <div className="text-xs font-bold text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    ⚠ {specialInstructions}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="text-center pt-3 space-y-2 text-[11px] text-stone-500">
                <div className="text-xs font-black uppercase tracking-wider">*** END OF KOT ***</div>
                <div className="text-[9px] text-stone-300 tracking-widest pt-1">
                  KITCHEN USE ONLY · NO PRICES
                </div>
                <div className="text-center text-[10px] tracking-[0.2em] text-stone-400 mt-4 pb-1">
                  ──✂── TEAR / AUTO-CUT HERE ──✂──
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-white border-t border-stone-200 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-stone-900 hover:bg-stone-800 shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <Printer className="w-4 h-4" />
                <span>Print KOT (Kitchen Printer)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handlePrint();
                }}
                className="py-3 px-3.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                title="Reprint KOT"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reprint</span>
              </button>
            </div>
            <p className="text-[10px] text-stone-400 text-center">
              Kitchen ticket · No prices shown · 80mm/58mm thermal compatible
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
