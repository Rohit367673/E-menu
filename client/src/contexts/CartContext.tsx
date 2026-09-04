import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import type { MenuItem, Order, OrderStatus, ActiveTableData } from '../types/menu';
import apiClient from '../api/client';

export interface CartLineItem {
  item: MenuItem;
  quantity: number;
  notes?: string;
}

interface CartContextType {
  cartItems: CartLineItem[];
  addItem: (item: MenuItem, notes?: string) => void;
  removeItem: (itemId: string) => void;
  deleteItem: (itemId: string) => void;
  getItemQuantity: (itemId: string) => number;
  clearCart: () => void;
  tableNumber: string;
  setTableNumber: (table: string) => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  specialInstructions: string;
  setSpecialInstructions: (note: string) => void;
  totalItems: number;
  totalPrice: number;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (isOpen: boolean) => void;
  activeOrders: Order[];
  activeTableBill: number;
  activeRoundsCount: number;
  overallStatus: 'none' | OrderStatus;
  isTableSettled: boolean;
  dismissSettledNotification: () => void;
  resetTableSession: () => void;
  fetchActiveOrders: () => Promise<void>;
  lastPlacedOrder: Order | null;
  setLastPlacedOrder: (order: Order | null) => void;
  placeOrder: (slug?: string) => Promise<{ success: boolean; order?: Order; message?: string }>;
  isSubmittingOrder: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY_CART = 'emenu_cart_items';
const STORAGE_KEY_TABLE = 'emenu_table_number';
const STORAGE_KEY_NAME = 'emenu_customer_name';
const STORAGE_KEY_PHONE = 'emenu_customer_phone';

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartLineItem[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_CART);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [tableNumber, setTableNumberState] = useState<string>(() => {
    try {
      // Check URL query param ?table= first
      const params = new URLSearchParams(window.location.search);
      const urlTable = params.get('table');
      if (urlTable) {
        localStorage.setItem(STORAGE_KEY_TABLE, urlTable);
        return urlTable;
      }
      return localStorage.getItem(STORAGE_KEY_TABLE) || '';
    } catch {
      return '';
    }
  });

  const [customerName, setCustomerNameState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_NAME) || '';
    } catch {
      return '';
    }
  });

  const [customerPhone, setCustomerPhoneState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_PHONE) || '';
    } catch {
      return '';
    }
  });

  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [activeTableBill, setActiveTableBill] = useState(0);
  const [activeRoundsCount, setActiveRoundsCount] = useState(0);
  const [overallStatus, setOverallStatus] = useState<'none' | OrderStatus>('none');
  const [isTableSettled, setIsTableSettled] = useState(false);
  const hadActiveOrdersRef = useRef(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Sync table from URL if changed
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlTable = params.get('table');
      if (urlTable && urlTable !== tableNumber) {
        setTableNumberState(urlTable);
        localStorage.setItem(STORAGE_KEY_TABLE, urlTable);
      }
    } catch {}
  }, [tableNumber]);

  // Persist cart to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cartItems));
    } catch {}
  }, [cartItems]);

  const setTableNumber = useCallback((tbl: string) => {
    setTableNumberState(tbl);
    try {
      localStorage.setItem(STORAGE_KEY_TABLE, tbl);
    } catch {}
  }, []);

  const setCustomerName = useCallback((name: string) => {
    setCustomerNameState(name);
    try {
      localStorage.setItem(STORAGE_KEY_NAME, name);
    } catch {}
  }, []);

  const setCustomerPhone = useCallback((phone: string) => {
    setCustomerPhoneState(phone);
    try {
      localStorage.setItem(STORAGE_KEY_PHONE, phone);
    } catch {}
  }, []);

  const addItem = useCallback((item: MenuItem, notes?: string) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex((ci) => ci.item._id === item._id);
      if (existingIdx !== -1) {
        const copy = [...prev];
        copy[existingIdx] = {
          ...copy[existingIdx],
          quantity: copy[existingIdx].quantity + 1,
          notes: notes !== undefined ? notes : copy[existingIdx].notes,
        };
        return copy;
      }
      return [...prev, { item, quantity: 1, notes: notes || '' }];
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex((ci) => ci.item._id === itemId);
      if (existingIdx === -1) return prev;

      const current = prev[existingIdx];
      if (current.quantity <= 1) {
        return prev.filter((ci) => ci.item._id !== itemId);
      }

      const copy = [...prev];
      copy[existingIdx] = { ...current, quantity: current.quantity - 1 };
      return copy;
    });
  }, []);

  const deleteItem = useCallback((itemId: string) => {
    setCartItems((prev) => prev.filter((ci) => ci.item._id !== itemId));
  }, []);

  const getItemQuantity = useCallback(
    (itemId: string) => {
      const found = cartItems.find((ci) => ci.item._id === itemId);
      return found ? found.quantity : 0;
    },
    [cartItems]
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
    setSpecialInstructions('');
    try {
      sessionStorage.removeItem(STORAGE_KEY_CART);
    } catch {}
  }, []);

  const totalItems = useMemo(
    () => cartItems.reduce((acc, ci) => acc + ci.quantity, 0),
    [cartItems]
  );

  const totalPrice = useMemo(
    () =>
      cartItems.reduce((acc, ci) => {
        const price = ci.item.discountPrice && ci.item.discountPrice < ci.item.price
          ? ci.item.discountPrice
          : ci.item.price;
        return acc + price * ci.quantity;
      }, 0),
    [cartItems]
  );

  // Fetch active table orders for Flow Ordering tracker
  const fetchActiveOrders = useCallback(async () => {
    if (!tableNumber) return;
    try {
      const res = await apiClient.get<{
        success: boolean;
        data: ActiveTableData;
      }>(`/orders/public/active/${encodeURIComponent(tableNumber)}`);

      if (res.data.success && res.data.data) {
        const fetchedOrders = res.data.data.orders || [];
        const wasActive = hadActiveOrdersRef.current;

        setActiveOrders(fetchedOrders);
        setActiveTableBill(res.data.data.totalBill || 0);
        setActiveRoundsCount(res.data.data.activeRounds || 0);
        setOverallStatus(res.data.data.overallStatus || 'none');

        if (fetchedOrders.length > 0) {
          hadActiveOrdersRef.current = true;
          if (res.data.data.customerName && !customerName) {
            setCustomerNameState(res.data.data.customerName);
          }
        } else if (wasActive && fetchedOrders.length === 0) {
          // Table was settled by receptionist!
          setIsTableSettled(true);
          hadActiveOrdersRef.current = false;
        }
      }
    } catch {
      // Quiet fail if network unavailable
    }
  }, [tableNumber, customerName]);

  // Initial fetch and auto-polling every 5 seconds with Page Visibility guard (rush hour optimization)
  useEffect(() => {
    if (!tableNumber) return;

    fetchActiveOrders();

    const intervalId = setInterval(() => {
      // Don't poll if the customer minimized browser or locked screen
      if (document.hidden) return;
      fetchActiveOrders();
    }, 5000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchActiveOrders();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [tableNumber, fetchActiveOrders]);

  const dismissSettledNotification = useCallback(() => {
    setIsTableSettled(false);
  }, []);

  const resetTableSession = useCallback(() => {
    setActiveOrders([]);
    setActiveTableBill(0);
    setActiveRoundsCount(0);
    setOverallStatus('none');
    setIsTableSettled(false);
    hadActiveOrdersRef.current = false;
    clearCart();
  }, [clearCart]);

  // Place order
  const placeOrder = useCallback(
    async (slug?: string): Promise<{ success: boolean; order?: Order; message?: string }> => {
      if (cartItems.length === 0) {
        return { success: false, message: 'Cart is empty' };
      }
      if (!tableNumber.trim()) {
        return { success: false, message: 'Please enter your table number' };
      }
      if (!customerName.trim()) {
        return { success: false, message: 'Please enter your name' };
      }

      setIsSubmittingOrder(true);
      try {
        const orderPayload = {
          tableNumber: tableNumber.trim(),
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim() || undefined,
          items: cartItems.map((ci) => ({
            menuItemId: ci.item._id,
            name: ci.item.name,
            price: ci.item.discountPrice && ci.item.discountPrice < ci.item.price
              ? ci.item.discountPrice
              : ci.item.price,
            quantity: ci.quantity,
            vegType: ci.item.vegType,
            notes: ci.notes,
          })),
          specialInstructions: specialInstructions.trim() || undefined,
          slug,
        };

        const res = await apiClient.post<{
          success: boolean;
          message: string;
          data: { order: Order; round: number; tableNumber: string };
        }>('/orders', orderPayload);

        if (res.data.success) {
          const createdOrder = res.data.data.order;
          setLastPlacedOrder(createdOrder);
          clearCart();
          await fetchActiveOrders();
          return { success: true, order: createdOrder, message: res.data.message };
        }
        return { success: false, message: 'Failed to place order' };
      } catch (err: any) {
        console.error('Place order failed:', err);
        return {
          success: false,
          message: err?.response?.data?.message || 'Failed to place order. Please try again.',
        };
      } finally {
        setIsSubmittingOrder(false);
      }
    },
    [cartItems, tableNumber, customerName, customerPhone, specialInstructions, clearCart, fetchActiveOrders]
  );

  const value = useMemo(
    () => ({
      cartItems,
      addItem,
      removeItem,
      deleteItem,
      getItemQuantity,
      clearCart,
      tableNumber,
      setTableNumber,
      customerName,
      setCustomerName,
      customerPhone,
      setCustomerPhone,
      specialInstructions,
      setSpecialInstructions,
      totalItems,
      totalPrice,
      isDrawerOpen,
      setIsDrawerOpen,
      activeOrders,
      activeTableBill,
      activeRoundsCount,
      overallStatus,
      isTableSettled,
      dismissSettledNotification,
      resetTableSession,
      fetchActiveOrders,
      lastPlacedOrder,
      setLastPlacedOrder,
      placeOrder,
      isSubmittingOrder,
    }),
    [
      cartItems,
      addItem,
      removeItem,
      deleteItem,
      getItemQuantity,
      clearCart,
      tableNumber,
      setTableNumber,
      customerName,
      setCustomerName,
      customerPhone,
      setCustomerPhone,
      specialInstructions,
      totalItems,
      totalPrice,
      isDrawerOpen,
      activeOrders,
      activeTableBill,
      activeRoundsCount,
      overallStatus,
      isTableSettled,
      dismissSettledNotification,
      resetTableSession,
      fetchActiveOrders,
      lastPlacedOrder,
      placeOrder,
      isSubmittingOrder,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
