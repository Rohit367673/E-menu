import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Printer, X, CheckCircle2, Clock, Receipt, Download, Coffee, Check } from 'lucide-react';
import type { Order, OrderItem } from '../../types/menu';

interface BillReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: string;
  customerName?: string;
  orders: Order[];
  restaurantName?: string;
  restaurantTagline?: string;
  restaurantAddress?: string;
  restaurantPhone?: string;
  gstin?: string;
  isSettled?: boolean;
  totalBill?: number;
}

export default function BillReceiptModal({
  isOpen,
  onClose,
  tableNumber,
  customerName = 'Guest',
  orders = [],
  restaurantName = 'Sukoon Cafe & Bar',
  restaurantTagline = 'Tableside Dining & Fresh Kitchen',
  restaurantAddress = 'Lake City · Main Road, City Center',
  restaurantPhone = '+91 98765 43210',
  gstin = '',
  isSettled = false,
  totalBill,
}: BillReceiptModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Aggregate items from all orders/rounds so duplicate items are combined with total quantity
  const itemMap = new Map<string, { name: string; quantity: number; price: number; vegType?: 'veg' | 'nonveg' }>();
  let calculatedTotal = 0;
  let totalItemsCount = 0;

  orders.forEach((order) => {
    order.items?.forEach((it: OrderItem) => {
      const key = `${it.name}-${it.price}`;
      const existing = itemMap.get(key);
      if (existing) {
        existing.quantity += it.quantity;
      } else {
        itemMap.set(key, {
          name: it.name,
          quantity: it.quantity,
          price: it.price,
          vegType: it.vegType,
        });
      }
      calculatedTotal += it.price * it.quantity;
      totalItemsCount += it.quantity;
    });
  });

  const combinedItems = Array.from(itemMap.values());
  const finalBillAmount = totalBill ?? calculatedTotal;

  // Derive Invoice / Receipt Number & Date
  const firstOrder = orders[0];
  const receiptNumber = firstOrder?.orderNumber
    ? `INV-${firstOrder.orderNumber}`
    : `INV-T${tableNumber || '0'}-${Date.now().toString().slice(-6)}`;

  const orderDate = firstOrder?.createdAt
    ? new Date(firstOrder.createdAt)
    : new Date();

  const formattedDate = orderDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = orderDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Check if any order is settled or explicitly marked settled
  const settledStatus =
    isSettled ||
    (orders.length > 0 && orders.every((o) => o.status === 'completed'));

  // Trigger Print to Thermal Machine
  const handlePrint = () => {
    document.body.classList.add('printing-receipt');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-receipt');
    }, 1000);
  };

  const handleCopySummary = () => {
    const textSummary = `
🧾 ${restaurantName} - Bill Receipt
Table: ${tableNumber} | Guest: ${customerName}
Invoice: ${receiptNumber} | Date: ${formattedDate} ${formattedTime}
----------------------------------------
${combinedItems.map((it) => `${it.name} x${it.quantity} = ₹${it.price * it.quantity}`).join('\n')}
----------------------------------------
Total Qty: ${totalItemsCount} items
Grand Total: ₹${finalBillAmount}
Status: ${settledStatus ? 'PAID & SETTLED' : 'PAYMENT DUE'}
Thank you for dining with us! 🙏
`.trim();

    navigator.clipboard.writeText(textSummary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-stone-100 rounded-3xl shadow-2xl border border-stone-300 z-10 my-auto overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Top Control Bar */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-stone-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-stone-900 tracking-tight">
                  Itemized Bill Receipt
                </h3>
                <p className="text-[11px] text-stone-500 font-medium">
                  Table {tableNumber} · {orders.length} round{orders.length > 1 ? 's' : ''}
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

          {/* Scrollable Receipt Preview Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex justify-center bg-stone-100/70">
            {/* The Actual Printable Thermal Slip */}
            <div
              id="thermal-receipt-printable"
              className="w-full bg-white text-stone-900 rounded-xl p-5 shadow-md border border-stone-200/80 font-mono text-[13px] leading-relaxed relative"
              style={{
                fontFamily: `'JetBrains Mono', 'Courier New', Courier, monospace`,
              }}
            >
              {/* Receipt Header */}
              <div className="text-center space-y-1 pb-3 border-b-2 border-dashed border-stone-300">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-stone-900 text-white mb-1">
                  <Coffee className="w-4 h-4" />
                </div>
                <h2 className="text-base font-black uppercase tracking-wider text-stone-900">
                  {restaurantName}
                </h2>
                <p className="text-[11px] text-stone-600 font-medium">
                  {restaurantTagline}
                </p>
                <p className="text-[10px] text-stone-500">
                  {restaurantAddress}
                </p>
                {restaurantPhone && (
                  <p className="text-[10px] text-stone-500">
                    Ph: {restaurantPhone}
                  </p>
                )}
                {gstin && (
                  <p className="text-[10px] text-stone-500">
                    GSTIN: {gstin}
                  </p>
                )}
              </div>

              {/* Order Meta Info */}
              <div className="py-2.5 border-b border-dashed border-stone-300 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-500">Invoice:</span>
                  <span className="font-bold">{receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Date/Time:</span>
                  <span>{formattedDate} · {formattedTime}</span>
                </div>
                <div className="flex justify-between font-bold text-stone-900 pt-0.5">
                  <span className="bg-stone-100 px-1.5 py-0.5 rounded">TABLE: {tableNumber}</span>
                  <span>GUEST: {customerName}</span>
                </div>
                {orders.length > 1 && (
                  <div className="flex justify-between text-stone-500 text-[10px]">
                    <span>Rounds Merged:</span>
                    <span>{orders.map((o) => `R${o.round}`).join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Items Column Header */}
              <div className="py-2 border-b-2 border-stone-800 text-[11px] font-bold uppercase tracking-wider flex justify-between">
                <span className="w-1/2">Item Description</span>
                <span className="w-1/6 text-center">Qty</span>
                <span className="w-1/6 text-right">Rate</span>
                <span className="w-1/6 text-right">Amt</span>
              </div>

              {/* Itemized Rows */}
              <div className="py-2 space-y-1.5 border-b-2 border-dashed border-stone-300 text-xs">
                {combinedItems.length === 0 ? (
                  <div className="py-4 text-center text-stone-400 italic text-[11px]">
                    No items found for this table.
                  </div>
                ) : (
                  combinedItems.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-start leading-tight">
                      <div className="w-1/2 pr-1 break-words font-medium">
                        {it.vegType && (
                          <span className={it.vegType === 'veg' ? 'text-emerald-700' : 'text-red-700'}>
                            {it.vegType === 'veg' ? '● ' : '▲ '}
                          </span>
                        )}
                        {it.name}
                      </div>
                      <div className="w-1/6 text-center font-bold text-stone-800">
                        {it.quantity}x
                      </div>
                      <div className="w-1/6 text-right text-stone-600">
                        ₹{it.price}
                      </div>
                      <div className="w-1/6 text-right font-bold text-stone-900">
                        ₹{it.price * it.quantity}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Totals & Summary */}
              <div className="py-2.5 border-b-2 border-stone-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600 text-[11px]">
                  <span>Total Quantity:</span>
                  <span className="font-bold text-stone-900">{totalItemsCount} items</span>
                </div>
                <div className="flex justify-between text-stone-600 text-[11px]">
                  <span>Subtotal:</span>
                  <span>₹{finalBillAmount}</span>
                </div>
                <div className="flex justify-between text-stone-600 text-[11px]">
                  <span>GST & Service Charges:</span>
                  <span className="text-emerald-700 font-semibold">Included</span>
                </div>
                <div className="pt-1.5 border-t border-dashed border-stone-300 flex justify-between text-sm font-black text-stone-900">
                  <span>GRAND TOTAL:</span>
                  <span className="text-base">₹{finalBillAmount}</span>
                </div>
              </div>

              {/* Payment Settlement Status Badge */}
              <div className="py-3 text-center space-y-1 border-b border-dashed border-stone-300">
                <div
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase ${
                    settledStatus
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {settledStatus ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>PAID & SETTLED</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      <span>PAYMENT DUE / TO PAY</span>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-stone-400">
                  {settledStatus ? 'Counter Settled · Receipt Valid' : 'Pay at counter or to tableside server'}
                </p>
              </div>

              {/* Footer Greeting & Tear Line */}
              <div className="text-center pt-3 space-y-1 text-[11px] text-stone-600">
                <p className="font-bold">Thank you for dining at Sukoon! 🙏</p>
                <p className="text-[10px] text-stone-400">Please visit again soon</p>
                <div className="text-[9px] text-stone-300 tracking-widest pt-2">
                  *** THERMAL POS RECEIPT ***
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer for Manager & Customer */}
          <div className="p-4 bg-white border-t border-stone-200 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {/* Thermal Printer Trigger */}
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-stone-900 hover:bg-stone-800 shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-98"
                id="receipt-print-btn"
              >
                <Printer className="w-4 h-4" />
                <span>Print Bill (Machine / POS)</span>
              </button>

              {/* Digital Copy / Share button */}
              <button
                type="button"
                onClick={handleCopySummary}
                className="py-3 px-3.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                title="Copy bill text summary to clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Download className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <p className="text-[10px] text-stone-400 text-center">
              Compatible with 80mm & 58mm thermal receipt billing machines, USB POS printers & mobile saving.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
