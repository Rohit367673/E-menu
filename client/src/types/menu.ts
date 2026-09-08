export interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  image?: string;
  category: string; // references Category ID
  vegType: 'veg' | 'nonveg';
  featured: boolean;
  available: boolean;
  order: number;

  // Backward compatibility fields
  isAvailable: boolean;
  tags?: string[];
  badges?: {
    popular: boolean;
    new: boolean;
    spicy: boolean;
    vegetarian: boolean;
  };
}

export type Badge = 'popular' | 'new' | 'spicy' | 'vegetarian';

export interface Category {
  _id: string;
  name: string;
  sortOrder: number;
  order: number;
  printSketch?: string;
  
  // Backward compatibility
  description?: string;
  icon?: string;
  isActive?: boolean;
}

export interface TemplateConfig {
  templateId: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary?: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  borderRadius: string | number;
  cardStyle: 'elevated' | 'outlined' | 'flat' | 'glass';
  categoryStyle: 'tabs' | 'pills' | 'underline' | 'cards';
  backgroundPattern?: string;
  shadows: boolean;
}

export interface Restaurant {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  phone?: string;
  address?: string;
  googleReviewUrl?: string;
  googleRating?: number;
  owner: string;
  templateConfig: TemplateConfig;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id?: string;
  id?: string;
  email: string;
  name?: string;
  role?: 'admin' | 'manager';
}

export interface Review {
  _id: string;
  restaurantId: string;
  name: string;
  rating: number;
  comment?: string;
  tags?: string[];
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

export type OrderStatus = 'pending' | 'preparing' | 'served' | 'completed' | 'cancelled';

export interface OrderItem {
  menuItemId?: string;
  name: string;
  price: number;
  quantity: number;
  vegType?: 'veg' | 'nonveg';
  notes?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  restaurantId: string;
  tableNumber: string;
  customerName: string;
  customerPhone?: string;
  items: OrderItem[];
  totalAmount: number;
  totalItems: number;
  status: OrderStatus;
  specialInstructions?: string;
  round: number;
  billRequested?: boolean;
  billRequestedAt?: string;
  createdAt: string;
  updatedAt: string;
  sessionId?: string;
  kotNumber?: string;
  kotGeneratedAt?: string;
  kotPrintJobId?: string;
  kotPrintStatus?: 'PENDING' | 'PRINTING' | 'PRINTED' | 'FAILED';
  kotPrintAttempts?: number;
  kotPrintedAt?: string;
  printingStartedAt?: string;
  printingBy?: string;
}

export interface OrderDashboardStats {
  pendingCount: number;
  preparingCount: number;
  servedCount: number;
  activeCount: number;
  todayOrdersCount: number;
  billRequestedCount?: number;
  todaySales?: number | null;
  monthlySales?: number | null;
}

export interface ActiveTableData {
  tableNumber: string;
  orders: Order[];
  totalBill: number;
  totalItems: number;
  activeRounds: number;
  overallStatus?: 'none' | OrderStatus;
  customerName?: string;
  recentlySettled?: boolean;
  settledOrders?: Order[];
  settledTotalBill?: number;
  billRequested?: boolean;
  sessionId?: string;
  sessionNumber?: string;
}

export interface TableSession {
  _id: string;
  restaurantId: string;
  sessionNumber: string;
  tableNumber: string;
  customerName: string;
  customerPhone?: string;
  status: 'active' | 'settled' | 'cleared';
  billRequested: boolean;
  billRequestedAt?: string;
  startedAt: string;
  settledAt?: string;
}

export interface KOTData {
  kotNumber: string;
  tableNumber: string;
  round: number;
  orderNumber: string;
  customerName: string;
  time: string;
  items: Array<{ name: string; quantity: number; notes?: string }>;
  specialInstructions?: string;
}

export interface PrintJob {
  printJobId: string;
  orderId: string;
  kotNumber: string;
  tableNumber: string;
  round: number;
  customerName: string;
  time: string;
  items: Array<{ name: string; quantity: number; notes?: string }>;
  specialInstructions?: string;
  isReprint?: boolean;
}


