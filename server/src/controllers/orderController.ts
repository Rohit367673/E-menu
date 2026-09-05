import { Request, Response } from 'express';
import Order, { IOrderItem, OrderStatus } from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import { findRestaurantBySlug, getOrCreateRestaurant } from '../utils/restaurant.js';
import { AuthRequest } from '../middleware/auth.js';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      tableNumber,
      customerName,
      customerPhone,
      items,
      specialInstructions,
      slug,
    } = req.body;

    if (!tableNumber || !tableNumber.toString().trim()) {
      res.status(400).json({ success: false, message: 'Table number is required' });
      return;
    }

    if (!customerName || !customerName.toString().trim()) {
      res.status(400).json({ success: false, message: 'Customer name is required' });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'Order must contain at least one item' });
      return;
    }

    let restaurant = slug ? await findRestaurantBySlug(slug) : null;
    if (!restaurant) {
      restaurant = await getOrCreateRestaurant();
    }

    const cleanTable = tableNumber.toString().trim();
    const cleanCustomerName = customerName.toString().trim();

    // Check existing active orders for this table to calculate Flow Ordering round
    const existingActive = await Order.find({
      restaurantId: restaurant._id,
      tableNumber: cleanTable,
      status: { $in: ['pending', 'preparing', 'served'] },
    });

    const round = existingActive.length + 1;

    // Validate items and calculate totals
    let totalAmount = 0;
    let totalItems = 0;

    const validatedItems: IOrderItem[] = items.map((it: any) => {
      const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
      const price = Math.max(0, parseFloat(it.price) || 0);
      totalAmount += price * qty;
      totalItems += qty;

      return {
        menuItemId: it.menuItemId || undefined,
        name: (it.name || 'Menu Item').toString().trim(),
        price,
        quantity: qty,
        vegType: it.vegType === 'nonveg' ? 'nonveg' : 'veg',
        notes: (it.notes || '').toString().trim(),
      };
    });

    // Generate readable order number (#101, #102, etc.)
    const totalOrderCount = await Order.countDocuments({ restaurantId: restaurant._id });
    const orderNumber = `#${101 + (totalOrderCount % 899)}`;

    // Direct Kitchen Workflow: Orders enter 'preparing' immediately with NO approval click required
    const order = new Order({
      restaurantId: restaurant._id,
      orderNumber,
      tableNumber: cleanTable,
      customerName: cleanCustomerName,
      customerPhone: (customerPhone || '').toString().trim(),
      items: validatedItems,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalItems,
      status: 'preparing',
      specialInstructions: (specialInstructions || '').toString().trim(),
      round,
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: round > 1
        ? `Round ${round} order sent directly to kitchen!`
        : `Order sent directly to kitchen for Table ${cleanTable}!`,
      data: {
        order,
        round,
        tableNumber: cleanTable,
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Failed to place order' });
  }
};

export const getActiveTableOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tableNumber } = req.params;
    const { slug } = req.query;

    if (!tableNumber) {
      res.status(400).json({ success: false, message: 'Table number is required' });
      return;
    }

    const restaurant = await findRestaurantBySlug(typeof slug === 'string' ? slug : undefined);
    if (!restaurant) {
      res.status(404).json({ success: false, message: 'Restaurant not found' });
      return;
    }

    const cleanTable = tableNumber.toString().trim();

    const orders = await Order.find({
      restaurantId: restaurant._id,
      tableNumber: cleanTable,
      status: { $in: ['pending', 'preparing', 'served'] },
    }).sort({ createdAt: 1 }).lean();

    const totalBill = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalItems = orders.reduce((sum, o) => sum + o.totalItems, 0);

    let overallStatus: 'none' | OrderStatus = 'none';
    if (orders.some((o) => o.status === 'preparing' || o.status === 'pending')) {
      overallStatus = 'preparing';
    } else if (orders.some((o) => o.status === 'served')) {
      overallStatus = 'served';
    }

    // Check if table was recently completed
    let recentlySettled = false;
    if (orders.length === 0) {
      const lastCompleted = await Order.findOne({
        restaurantId: restaurant._id,
        tableNumber: cleanTable,
        status: 'completed',
      }).sort({ updatedAt: -1 }).select('_id updatedAt').lean();

      if (lastCompleted && (Date.now() - new Date(lastCompleted.updatedAt).getTime()) < 30 * 60 * 1000) {
        recentlySettled = true;
      }
    }

    res.json({
      success: true,
      data: {
        tableNumber: cleanTable,
        orders,
        totalBill: Math.round(totalBill * 100) / 100,
        totalItems,
        activeRounds: orders.length,
        overallStatus,
        customerName: orders[0]?.customerName || '',
        recentlySettled,
      },
    });
  } catch (error) {
    console.error('Get active table orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve active table orders' });
  }
};

export const getAdminOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurant = await getOrCreateRestaurant();
    const { status, table } = req.query;

    const query: any = { restaurantId: restaurant._id };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (table && table !== 'all') {
      query.tableNumber = table;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(100).lean();

    // Calculate live summary stats
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const isManager = req.user?.role === 'manager';

    const [pendingCount, preparingCount, servedCount, todayOrdersCount] = await Promise.all([
      Order.countDocuments({ restaurantId: restaurant._id, status: 'pending' }),
      Order.countDocuments({ restaurantId: restaurant._id, status: 'preparing' }),
      Order.countDocuments({ restaurantId: restaurant._id, status: 'served' }),
      Order.countDocuments({
        restaurantId: restaurant._id,
        createdAt: { $gte: startOfToday },
        status: { $ne: 'cancelled' },
      }),
    ]);

    // Financial privacy: Only admin (owner) receives daily and monthly earnings
    let todaySales: number | null = null;
    let monthlySales: number | null = null;

    if (!isManager) {
      const [todayOrders, monthOrders] = await Promise.all([
        Order.find({
          restaurantId: restaurant._id,
          createdAt: { $gte: startOfToday },
          status: { $ne: 'cancelled' },
        }).select('totalAmount').lean(),
        Order.find({
          restaurantId: restaurant._id,
          createdAt: { $gte: startOfMonth },
          status: { $ne: 'cancelled' },
        }).select('totalAmount').lean(),
      ]);

      todaySales = Math.round(todayOrders.reduce((sum, o) => sum + o.totalAmount, 0) * 100) / 100;
      monthlySales = Math.round(monthOrders.reduce((sum, o) => sum + o.totalAmount, 0) * 100) / 100;
    }

    // Manager financial privacy: Strip order amounts and item prices
    const sanitizedOrders = isManager
      ? orders.map((o) => ({
          ...o,
          totalAmount: 0,
          items: o.items.map((it) => ({
            ...it,
            price: 0,
          })),
        }))
      : orders;

    res.json({
      success: true,
      data: {
        orders: sanitizedOrders,
        stats: {
          pendingCount,
          preparingCount,
          servedCount,
          activeCount: pendingCount + preparingCount + servedCount,
          todayOrdersCount,
          todaySales,
          monthlySales,
        },
      },
    });
  } catch (error) {
    console.error('Get admin orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve orders' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses: OrderStatus[] = ['pending', 'preparing', 'served', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    res.json({
      success: true,
      message: `Order ${order.orderNumber} status updated to ${status}`,
      data: { order },
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
};

export const settleTableOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { tableNumber } = req.params;
    const restaurant = await getOrCreateRestaurant();

    if (!tableNumber) {
      res.status(400).json({ success: false, message: 'Table number is required' });
      return;
    }

    const result = await Order.updateMany(
      {
        restaurantId: restaurant._id,
        tableNumber: tableNumber.toString().trim(),
        status: { $in: ['pending', 'preparing', 'served'] },
      },
      { $set: { status: 'completed' } }
    );

    res.json({
      success: true,
      message: `Table ${tableNumber} bill settled! (${result.modifiedCount} active orders completed)`,
      data: { settledCount: result.modifiedCount },
    });
  } catch (error) {
    console.error('Settle table orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to settle table orders' });
  }
};

export const deleteOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await Order.findByIdAndDelete(id);
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete order' });
  }
};

export const resetTableSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { tableNumber } = req.params;
    const restaurant = await getOrCreateRestaurant();

    if (!tableNumber) {
      res.status(400).json({ success: false, message: 'Table number is required' });
      return;
    }

    const cleanTable = tableNumber.toString().trim();
    // Delete all orders for this table so the table is completely cleared from the dashboard
    const result = await Order.deleteMany({
      restaurantId: restaurant._id,
      tableNumber: cleanTable,
    });

    res.json({
      success: true,
      message: `Table ${cleanTable} cleared successfully (${result.deletedCount} orders removed)`,
      data: { clearedCount: result.deletedCount },
    });
  } catch (error) {
    console.error('Reset table session error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset table session' });
  }
};

export const getMonthlyEarningsReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Financial privacy check: Only owner (admin role) can access monthly detailed earnings
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Monthly earnings reports are confidential to owner only.',
      });
      return;
    }

    const restaurant = await getOrCreateRestaurant();
    const now = new Date();
    const year = parseInt(req.query.year as string, 10) || now.getFullYear();
    const month = parseInt(req.query.month as string, 10) || (now.getMonth() + 1);

    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 1, 0, 0, 0, 0);
    const daysInMonth = new Date(year, month, 0).getDate();

    const orders = await Order.find({
      restaurantId: restaurant._id,
      createdAt: { $gte: startDate, $lt: endDate },
      status: { $ne: 'cancelled' },
    }).sort({ createdAt: 1 }).lean();

    let totalMonthSales = 0;
    let totalMonthOrders = orders.length;
    let totalMonthItems = 0;

    const monthItemCounts: Record<string, { name: string; quantity: number; totalRevenue: number; vegType: string }> = {};

    // Initialize all days of the month
    const daysData = Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      const dayDate = new Date(year, month - 1, dayNum);
      return {
        day: dayNum,
        dateStr: dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        dayOfWeek: dayDate.toLocaleDateString('en-US', { weekday: 'short' }),
        totalSales: 0,
        ordersCount: 0,
        itemsCount: 0,
        itemsSold: [] as Array<{ name: string; quantity: number; price: number; totalRevenue: number; vegType: string }>,
        orders: [] as Array<{
          _id: any;
          orderNumber: string;
          tableNumber: string;
          customerName: string;
          time: string;
          totalAmount: number;
          itemsCount: number;
          items: Array<{ name: string; quantity: number; price: number; vegType?: string }>;
        }>,
      };
    });

    // Bucket orders into days
    orders.forEach((ord) => {
      const ordDate = new Date(ord.createdAt);
      const dayIdx = ordDate.getDate() - 1;
      if (dayIdx >= 0 && dayIdx < daysInMonth) {
        daysData[dayIdx].totalSales += ord.totalAmount;
        daysData[dayIdx].ordersCount += 1;
        daysData[dayIdx].itemsCount += ord.totalItems;

        totalMonthSales += ord.totalAmount;
        totalMonthItems += ord.totalItems;

        daysData[dayIdx].orders.push({
          _id: ord._id,
          orderNumber: ord.orderNumber,
          tableNumber: ord.tableNumber,
          customerName: ord.customerName,
          time: ordDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          totalAmount: ord.totalAmount,
          itemsCount: ord.totalItems,
          items: ord.items.map((it) => ({
            name: it.name,
            quantity: it.quantity,
            price: it.price,
            vegType: it.vegType,
          })),
        });
      }
    });

    // Compute itemized breakdown for each day
    daysData.forEach((d) => {
      const dayItemsMap: Record<string, { name: string; quantity: number; price: number; totalRevenue: number; vegType: string }> = {};

      d.orders.forEach((ord) => {
        ord.items.forEach((it) => {
          if (!dayItemsMap[it.name]) {
            dayItemsMap[it.name] = {
              name: it.name,
              quantity: 0,
              price: it.price,
              totalRevenue: 0,
              vegType: it.vegType || 'veg',
            };
          }
          dayItemsMap[it.name].quantity += it.quantity;
          dayItemsMap[it.name].totalRevenue += it.price * it.quantity;

          if (!monthItemCounts[it.name]) {
            monthItemCounts[it.name] = {
              name: it.name,
              quantity: 0,
              totalRevenue: 0,
              vegType: it.vegType || 'veg',
            };
          }
          monthItemCounts[it.name].quantity += it.quantity;
          monthItemCounts[it.name].totalRevenue += it.price * it.quantity;
        });
      });

      d.totalSales = Math.round(d.totalSales * 100) / 100;
      d.itemsSold = Object.values(dayItemsMap).sort((a, b) => b.quantity - a.quantity);
    });

    const topSellers = Object.values(monthItemCounts).sort((a, b) => b.quantity - a.quantity);
    const topSellingDish = topSellers[0] ? `${topSellers[0].name} (${topSellers[0].quantity} sold)` : 'None';

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    res.json({
      success: true,
      data: {
        year,
        month,
        monthName: monthNames[month - 1],
        totalMonthSales: Math.round(totalMonthSales * 100) / 100,
        totalMonthOrders,
        totalMonthItems,
        topSellingDish,
        days: daysData,
      },
    });
  } catch (error) {
    console.error('Get monthly earnings error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve monthly earnings report' });
  }
};

