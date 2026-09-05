import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ChefHat,
  Clock,
  CheckCircle2,
  ShoppingBag,
  Send,
  Coffee,
  AlertCircle,
  Receipt,
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { playOrderNotificationSound } from '../../utils/sound';
import BillReceiptModal from '../common/BillReceiptModal';

interface OrderDrawerProps {
  primaryColor?: string;
  headingFont?: string;
  restaurantName?: string;
  slug?: string;
}

export default function OrderDrawer({
  primaryColor = '#8B5E3C',
  headingFont = 'Playfair Display',
  restaurantName = 'Sukoon Cafe & Bar',
  slug,
}: OrderDrawerProps) {
  const {
    cartItems,
    addItem,
    removeItem,
    deleteItem,
    clearCart,
    tableNumber,
    setTableNumber,
    customerName,
    setCustomerName,
    specialInstructions,
    setSpecialInstructions,
    totalItems,
    totalPrice,
    isDrawerOpen,
    setIsDrawerOpen,
    activeOrders,
    activeTableBill,
    activeRoundsCount,
    lastPlacedOrder,
    placeOrder,
    isSubmittingOrder,
  } = useCart();

  const [errorMsg, setErrorMsg] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const handlePlaceOrder = async () => {
    setErrorMsg('');
    if (!tableNumber.trim()) {
      setErrorMsg('Please enter or select your table number.');
      return;
    }
    if (!customerName.trim()) {
      setErrorMsg('Please enter your name so we know who to serve.');
      return;
    }

    const res = await placeOrder(slug);
    if (res.success) {
      playOrderNotificationSound();
      setOrderSuccess(true);
    } else {
      setErrorMsg(res.message || 'Failed to place order. Please try again.');
    }
  };

  const handleClose = () => {
    setIsDrawerOpen(false);
    setErrorMsg('');
    if (orderSuccess) {
      setTimeout(() => setOrderSuccess(false), 300);
    }
  };

  if (!isDrawerOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal / Drawer Content */}
        <motion.div
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0.5 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[#FAF7F2] rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[92vh] flex flex-col overflow-hidden border border-[#e8dfd5]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8dfd5] bg-white/90">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, #a86c3d)` }}
              >
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#2C1810]" style={{ fontFamily: headingFont }}>
                  {restaurantName}
                </h3>
                <p className="text-[11px] text-[#786b5f]">
                  {orderSuccess
                    ? 'Order Placed • Sent to Kitchen'
                    : activeOrders.length > 0
                    ? `Table ${tableNumber} • Round ${activeOrders.length + 1} (Flow Order)`
                    : 'Digital Tableside Ordering'}
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* SUCCESS VIEW */}
            {orderSuccess && lastPlacedOrder ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center py-6 space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300/60">
                    Order {lastPlacedOrder.orderNumber} Confirmed
                  </span>
                  <h4 className="text-xl font-bold text-[#2C1810]" style={{ fontFamily: headingFont }}>
                    Sent to Kitchen & Receptionist!
                  </h4>
                  <p className="text-xs text-[#786b5f] max-w-xs mx-auto">
                    Thank you <strong>{lastPlacedOrder.customerName}</strong>. Our chef is preparing your dishes for{' '}
                    <strong>Table {lastPlacedOrder.tableNumber}</strong>.
                  </p>
                </div>

                {/* Flow Ordering Status Pill */}
                <div className="w-full bg-white rounded-2xl p-4 border border-[#e8dfd5] text-left space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#786b5f] font-medium">Status:</span>
                    <span className="font-bold text-amber-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 animate-spin" /> Pending Kitchen Acceptance
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-100">
                    <span className="text-[#786b5f] font-medium">Round {lastPlacedOrder.round} Total:</span>
                    <span className="font-bold text-[#2C1810]">₹{lastPlacedOrder.totalAmount}</span>
                  </div>

                  {activeTableBill > lastPlacedOrder.totalAmount && (
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-[#786b5f] font-medium">Table Cumulative Bill:</span>
                      <span className="font-extrabold text-amber-800">₹{activeTableBill}</span>
                    </div>
                  )}
                </div>

                {/* CTA to keep ordering or close */}
                <div className="w-full space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReceiptOpen(true)}
                    className="w-full py-2.5 px-3 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Receipt className="w-4 h-4 text-amber-600" />
                    <span>View / Print Itemized Bill Receipt</span>
                  </button>

                  <button
                    onClick={handleClose}
                    className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-md cursor-pointer transition-all hover:brightness-110 active:scale-98"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, #a86c3d)` }}
                  >
                    + Add More Items (Flow Order)
                  </button>
                  <p className="text-[11px] text-[#786b5f]">
                    You can add more rounds anytime — they will be added to your table bill automatically.
                  </p>
                </div>
              </motion.div>
            ) : (
              <>
                {/* FLOW ORDERING ACTIVE BILL NOTIFICATION */}
                {activeOrders.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <ChefHat className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs space-y-1">
                        <div className="font-bold text-[#2C1810]">
                          Table {tableNumber}: {activeRoundsCount} Active Round{activeRoundsCount > 1 ? 's' : ''} in Kitchen
                        </div>
                        <p className="text-[#786b5f] leading-relaxed">
                          Running table bill: <strong>₹{activeTableBill}</strong>. This new order will be sent as{' '}
                          <strong className="text-amber-800 font-semibold">Round {activeOrders.length + 1}</strong>!
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsReceiptOpen(true)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white text-stone-800 border border-stone-200 text-xs font-bold shadow-2xs hover:bg-stone-50 transition-colors cursor-pointer flex-shrink-0"
                      title="View itemized bill receipt"
                    >
                      <Receipt className="w-3.5 h-3.5 text-amber-600" />
                      <span>Receipt</span>
                    </button>
                  </div>
                )}

                {/* CUSTOMER DETAILS FORM */}
                <div className="bg-white rounded-2xl p-4 border border-[#e8dfd5] space-y-3.5 shadow-2xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#786b5f]">
                    1. Table & Guest Details
                  </h4>

                  {/* Table Badge (Auto-Assigned from Table QR Code) */}
                  {tableNumber ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-stone-900 text-white font-black text-xs flex items-center justify-center shadow-xs">
                          T
                        </div>
                        <div>
                          <div className="text-xs font-black text-stone-900">
                            Table {tableNumber}
                          </div>
                          <div className="text-[10px] text-stone-500 font-medium">
                            Auto-detected from QR Code
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-md">
                        Connected ✓
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#2C1810]">
                        Table Number *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 4"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-stone-50/50"
                      />
                    </div>
                  )}

                  {/* Customer Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#2C1810]">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rohit"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-stone-50/50"
                    />
                  </div>

                  {/* Special Kitchen Notes */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#2C1810]">
                      Special Kitchen Instructions (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Extra napkins, make it spicy, less sugar"
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-stone-50/50"
                    />
                  </div>
                </div>

                {/* CART ITEMS LIST */}
                <div className="bg-white rounded-2xl p-4 border border-[#e8dfd5] space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#786b5f]">
                      2. Selected Items ({totalItems})
                    </h4>
                    {cartItems.length > 0 && (
                      <button
                        type="button"
                        onClick={clearCart}
                        className="text-[11px] text-red-500 hover:text-red-700 font-medium transition-colors cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {cartItems.length === 0 ? (
                    <div className="py-8 text-center text-stone-400 space-y-2">
                      <ShoppingBag className="w-8 h-8 mx-auto opacity-40" />
                      <p className="text-xs">Your order tray is currently empty.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-stone-100">
                      {cartItems.map(({ item, quantity, notes }) => {
                        const effectivePrice =
                          item.discountPrice && item.discountPrice < item.price
                            ? item.discountPrice
                            : item.price;

                        return (
                          <div key={item._id} className="py-2.5 flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                    item.vegType === 'nonveg' ? 'bg-red-500' : 'bg-emerald-500'
                                  }`}
                                />
                                <span
                                  className="text-xs font-bold text-[#2C1810] truncate"
                                  style={{ fontFamily: headingFont }}
                                >
                                  {item.name}
                                </span>
                              </div>
                              <div className="text-[11px] text-stone-400 pl-4">
                                ₹{effectivePrice} each
                              </div>
                              {notes && (
                                <div className="text-[10px] text-amber-700 italic pl-4">
                                  Note: {notes}
                                </div>
                              )}
                            </div>

                            {/* Quantity buttons */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="flex items-center rounded-lg border border-stone-200 bg-stone-50 overflow-hidden shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => removeItem(item._id)}
                                  className="w-7 h-7 flex items-center justify-center text-stone-600 hover:bg-stone-200 active:bg-stone-300 transition-colors cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-6 text-center text-xs font-bold text-[#2C1810]">
                                  {quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => addItem(item)}
                                  className="w-7 h-7 flex items-center justify-center text-stone-600 hover:bg-stone-200 active:bg-stone-300 transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <span className="text-xs font-bold text-[#2C1810] w-14 text-right">
                                ₹{effectivePrice * quantity}
                              </span>

                              <button
                                type="button"
                                onClick={() => deleteItem(item._id)}
                                className="text-stone-300 hover:text-red-500 transition-colors p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ERROR DISPLAY */}
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs flex items-center gap-2 border border-red-200">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* PRICE BREAKDOWN */}
                {cartItems.length > 0 && (
                  <div className="bg-white rounded-2xl p-4 border border-[#e8dfd5] space-y-2 text-xs shadow-2xs">
                    <div className="flex justify-between text-stone-600">
                      <span>Items Total ({totalItems})</span>
                      <span className="font-semibold">₹{totalPrice}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>Taxes & Service</span>
                      <span className="text-emerald-600 font-semibold">Included</span>
                    </div>
                    <div className="pt-2 border-t border-stone-100 flex justify-between text-sm font-extrabold text-[#2C1810]">
                      <span>Round Total</span>
                      <span className="text-base text-amber-800" style={{ fontFamily: headingFont }}>
                        ₹{totalPrice}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer CTA */}
          {!orderSuccess && (
            <div className="p-4 bg-white border-t border-[#e8dfd5] flex flex-col gap-2">
              <button
                type="button"
                disabled={cartItems.length === 0 || isSubmittingOrder}
                onClick={handlePlaceOrder}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-stone-950 shadow-md cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:brightness-110 active:scale-98"
                style={{
                  background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                  boxShadow: '0 6px 20px rgba(245, 158, 11, 0.4)',
                }}
              >
                {isSubmittingOrder ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                    <span>Sending to Kitchen...</span>
                  </div>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>
                      {activeOrders.length > 0
                        ? `Place Round ${activeOrders.length + 1} Order • ₹${totalPrice}`
                        : `Place Table Order • ₹${totalPrice}`}
                    </span>
                  </>
                )}
              </button>

              <div className="text-center text-[10px] text-stone-400">
                Instant digital notification will be sent to the receptionist & kitchen
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Customer Bill & Quantity Receipt Modal */}
      <BillReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        tableNumber={tableNumber}
        customerName={customerName || 'Guest'}
        orders={activeOrders.length > 0 ? activeOrders : lastPlacedOrder ? [lastPlacedOrder] : []}
        totalBill={activeOrders.length > 0 ? activeTableBill : lastPlacedOrder?.totalAmount}
        restaurantName={restaurantName}
        isSettled={false}
      />
    </AnimatePresence>
  );
}
