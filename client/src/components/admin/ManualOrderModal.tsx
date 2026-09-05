import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Search,
  Plus,
  Minus,
  Trash2,
  ChefHat,
  ShoppingBag,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { useRestaurant } from '../../contexts/RestaurantContext';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';

interface OrderItemDraft {
  menuItemId?: string;
  name: string;
  price: number;
  quantity: number;
  vegType: 'veg' | 'nonveg';
  notes?: string;
}

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTable?: string;
  isTableFixed?: boolean;
  onOrderCreated?: () => void;
}

const COMMON_TABLES = [
  'Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5',
  'Table 6', 'Table 7', 'Table 8', 'Table 9', 'Table 10',
];

export default function ManualOrderModal({
  isOpen,
  onClose,
  defaultTable = 'Table 1',
  isTableFixed = false,
  onOrderCreated,
}: ManualOrderModalProps) {
  const { menuItems, categories, restaurant } = useRestaurant();

  const [tableNumber, setTableNumber] = useState<string>(defaultTable);
  const [isCustomTable, setIsCustomTable] = useState<boolean>(false);
  const [showChangeTable, setShowChangeTable] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>('Walk-in Guest');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<OrderItemDraft[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [isDirectKitchen, setIsDirectKitchen] = useState<boolean>(true); // Direct Catering enabled by default
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Synchronize table selection whenever modal opens or defaultTable changes
  useEffect(() => {
    if (defaultTable) {
      setTableNumber(defaultTable);
      setIsCustomTable(!COMMON_TABLES.includes(defaultTable));
      setShowChangeTable(false);
    }
  }, [defaultTable, isOpen]);

  // Filter available dishes
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (selectedCategoryId !== 'all' && item.category !== selectedCategoryId) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        return matchName || matchDesc;
      }
      return true;
    });
  }, [menuItems, selectedCategoryId, searchQuery]);

  const handleAddItem = (dish: (typeof menuItems)[0]) => {
    setSelectedItems((prev) => {
      const existing = prev.find((it) => it.menuItemId === dish._id);
      if (existing) {
        return prev.map((it) =>
          it.menuItemId === dish._id ? { ...it, quantity: it.quantity + 1 } : it
        );
      }
      return [
        ...prev,
        {
          menuItemId: dish._id,
          name: dish.name,
          price: dish.discountPrice || dish.price,
          quantity: 1,
          vegType: dish.vegType || 'veg',
        },
      ];
    });
  };

  const handleUpdateQty = (menuItemId: string | undefined, delta: number) => {
    setSelectedItems((prev) =>
      prev
        .map((it) => {
          if (it.menuItemId === menuItemId) {
            const newQty = it.quantity + delta;
            return newQty > 0 ? { ...it, quantity: newQty } : null;
          }
          return it;
        })
        .filter(Boolean) as OrderItemDraft[]
    );
  };

  const handleRemoveItem = (menuItemId: string | undefined) => {
    setSelectedItems((prev) => prev.filter((it) => it.menuItemId !== menuItemId));
  };

  const handleUpdateNotes = (menuItemId: string | undefined, notes: string) => {
    setSelectedItems((prev) =>
      prev.map((it) => (it.menuItemId === menuItemId ? { ...it, notes } : it))
    );
  };

  const totalAmount = useMemo(() => {
    return selectedItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
  }, [selectedItems]);

  const totalItemCount = useMemo(() => {
    return selectedItems.reduce((sum, it) => sum + it.quantity, 0);
  }, [selectedItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tableNumber.trim()) {
      toast.error('Please specify a table number');
      return;
    }

    if (selectedItems.length === 0) {
      toast.error('Please add at least one item to the order');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        tableNumber: tableNumber.trim(),
        customerName: customerName.trim() || 'Walk-in Guest',
        customerPhone: customerPhone.trim() || undefined,
        items: selectedItems,
        specialInstructions: specialInstructions.trim() || undefined,
        isDirectOrder: true, // Always directly preparing in kitchen
        slug: restaurant?.slug || 'menu',
      };

      const res = await apiClient.post<{
        success: boolean;
        message: string;
        data: { order: any; round: number };
      }>('/orders', payload);

      if (res.data.success) {
        toast.success(`Order for ${tableNumber} sent directly to Kitchen!`);
        setSelectedItems([]);
        setSearchQuery('');
        setSpecialInstructions('');
        onClose();
        if (onOrderCreated) {
          onOrderCreated();
        }
      }
    } catch (err: any) {
      console.error('Failed to create manual order:', err);
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
                <ChefHat className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-stone-900">
                    Walk-in Order & Direct Catering (POS)
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-emerald-600" /> Direct Kitchen
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  Book guest orders directly without requiring customer QR scanning
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
            {/* Left: Table details & Menu Dish Browser */}
            <div className="flex-1 flex flex-col p-5 overflow-y-auto border-b lg:border-b-0 lg:border-r border-stone-200 gap-5">
              {/* Table & Guest Selection */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex flex-col gap-3">
                {isTableFixed ? (
                  <div>
                    <div className="flex items-center justify-between pb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-stone-600 uppercase tracking-wider">
                          Seating Table:
                        </span>
                        <span className="px-3 py-1 rounded-xl text-xs font-black bg-amber-600 text-white shadow-xs flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          {tableNumber}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowChangeTable((prev) => !prev)}
                        className="text-[11px] font-bold text-stone-500 hover:text-amber-700 underline cursor-pointer"
                      >
                        {showChangeTable ? 'Cancel' : 'Change Table'}
                      </button>
                    </div>

                    {showChangeTable && (
                      <div className="pt-2.5 mt-2 border-t border-stone-200/70">
                        <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5 block">
                          Switch Seating Table
                        </label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {COMMON_TABLES.map((t) => (
                            <button
                              type="button"
                              key={t}
                              onClick={() => {
                                setTableNumber(t);
                                setIsCustomTable(false);
                                setShowChangeTable(false);
                              }}
                              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                tableNumber === t && !isCustomTable
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setIsCustomTable(true)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isCustomTable
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                            }`}
                          >
                            Custom...
                          </button>
                        </div>
                        {isCustomTable && (
                          <input
                            type="text"
                            value={tableNumber}
                            onChange={(e) => setTableNumber(e.target.value)}
                            placeholder="e.g. Table 15 or Patio 3"
                            className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500 bg-white"
                            required
                          />
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 block">
                      Select Seating Table
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {COMMON_TABLES.map((t) => (
                        <button
                          type="button"
                          key={t}
                          onClick={() => {
                            setTableNumber(t);
                            setIsCustomTable(false);
                          }}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            tableNumber === t && !isCustomTable
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setIsCustomTable(true)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isCustomTable
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        Custom...
                      </button>
                    </div>

                    {isCustomTable && (
                      <input
                        type="text"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        placeholder="e.g. Table 15 or Patio 3"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500 bg-white"
                        required
                      />
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-stone-600 block mb-1">
                      Guest Name
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Walk-in Guest / Rahul"
                      className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-stone-600 block mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Menu Item Search & Categories */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search menu dishes..."
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-amber-500 bg-white"
                    />
                  </div>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId('all')}
                    className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategoryId === 'all'
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    All Items ({menuItems.length})
                  </button>
                  {categories.map((cat) => (
                    <button
                      type="button"
                      key={cat._id}
                      onClick={() => setSelectedCategoryId(cat._id)}
                      className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        selectedCategoryId === cat._id
                          ? 'bg-stone-900 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Dishes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {filteredItems.length === 0 ? (
                    <div className="col-span-2 py-8 text-center text-xs text-stone-400">
                      No matching dishes found.
                    </div>
                  ) : (
                    filteredItems.map((dish) => {
                      const inCart = selectedItems.find((it) => it.menuItemId === dish._id);
                      const isDishAvailable = dish.available !== false && dish.isAvailable !== false;
                      return (
                        <div
                          key={dish._id}
                          className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                            !isDishAvailable
                              ? 'opacity-50 bg-stone-100 border-stone-200 cursor-not-allowed'
                              : inCart
                              ? 'border-amber-500 bg-amber-50/40 cursor-pointer'
                              : 'border-stone-200 hover:border-stone-300 bg-white cursor-pointer'
                          }`}
                          onClick={() => {
                            if (isDishAvailable) handleAddItem(dish);
                          }}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                                dish.vegType === 'nonveg'
                                  ? 'border-red-600'
                                  : 'border-emerald-600'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  dish.vegType === 'nonveg' ? 'bg-red-600' : 'bg-emerald-600'
                                }`}
                              />
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-stone-900 truncate">
                                {dish.name}
                              </p>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-extrabold text-amber-700">
                                  ₹{dish.discountPrice || dish.price}
                                </span>
                                {!isDishAvailable && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-stone-200 text-stone-600">
                                    Unavailable
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={!isDishAvailable}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isDishAvailable) handleAddItem(dish);
                            }}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition-colors flex-shrink-0 ${
                              !isDishAvailable
                                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                                : inCart
                                ? 'bg-amber-600 text-white cursor-pointer'
                                : 'bg-stone-100 text-stone-700 hover:bg-amber-600 hover:text-white cursor-pointer'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right: Selected Order Cart & Summary */}
            <div className="w-full lg:w-96 p-5 bg-stone-50/50 flex flex-col justify-between gap-4">
              <div className="flex flex-col min-h-0">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-black text-stone-900">
                      Order Cart ({totalItemCount} items)
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-stone-600">
                    {tableNumber}
                  </span>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto max-h-[320px] py-3 flex flex-col gap-2.5 pr-1">
                  {selectedItems.length === 0 ? (
                    <div className="py-12 text-center flex flex-col items-center justify-center gap-2 text-stone-400">
                      <Utensils className="w-8 h-8 opacity-40" />
                      <p className="text-xs font-medium">No dishes added yet</p>
                      <p className="text-[11px] text-stone-400 max-w-[200px]">
                        Click any dish on the left to add it to this walk-in order
                      </p>
                    </div>
                  ) : (
                    selectedItems.map((item) => (
                      <div
                        key={item.menuItemId}
                        className="bg-white p-3 rounded-xl border border-stone-200 shadow-2xs flex flex-col gap-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-3 h-3 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                                  item.vegType === 'nonveg' ? 'border-red-600' : 'border-emerald-600'
                                }`}
                              >
                                <span
                                  className={`w-1 h-1 rounded-full ${
                                    item.vegType === 'nonveg' ? 'bg-red-600' : 'bg-emerald-600'
                                  }`}
                                />
                              </span>
                              <h4 className="text-xs font-bold text-stone-900 leading-snug">
                                {item.name}
                              </h4>
                            </div>
                            <span className="text-[11px] font-semibold text-stone-500 mt-0.5 block">
                              ₹{item.price} each
                            </span>
                          </div>

                          {/* Qty controller */}
                          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-lg">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.menuItemId, -1)}
                              className="w-5 h-5 rounded flex items-center justify-center bg-white text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-black text-stone-900 px-1">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.menuItemId, 1)}
                              className="w-5 h-5 rounded flex items-center justify-center bg-white text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Item Note input */}
                        <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
                          <input
                            type="text"
                            value={item.notes || ''}
                            onChange={(e) => handleUpdateNotes(item.menuItemId, e.target.value)}
                            placeholder="Add note (e.g. less spicy)..."
                            className="text-[10px] w-full px-2 py-1 rounded bg-stone-50 border border-stone-200 focus:outline-none focus:border-amber-400"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.menuItemId)}
                            className="text-stone-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Special Instructions & Direct Catering Option */}
                <div className="pt-2 flex flex-col gap-2">
                  <input
                    type="text"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="General table notes / kitchen instructions..."
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-500 bg-white"
                  />

                  {/* Direct Catering Workflow toggle */}
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isDirectKitchen}
                      onChange={(e) => setIsDirectKitchen(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <ChefHat className="w-3.5 h-3.5 text-emerald-700" />
                        Direct Catering (Sent to Kitchen)
                      </div>
                      <p className="text-[10px] text-emerald-800/80 leading-tight">
                        Order immediately starts "Preparing" without waiting for approval
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Bottom Total & Submit */}
              <div className="pt-3 border-t border-stone-200 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Total Amount
                  </span>
                  <span className="text-xl font-black text-stone-900">
                    ₹{totalAmount}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-stone-600 bg-white border border-stone-300 hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || selectedItems.length === 0}
                    className="flex-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      'Placing Order...'
                    ) : (
                      <>
                        <ChefHat className="w-4 h-4" />
                        Send Order to Kitchen (₹{totalAmount})
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
