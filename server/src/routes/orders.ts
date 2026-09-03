import { Router } from 'express';
import {
  createOrder,
  getActiveTableOrders,
  getAdminOrders,
  updateOrderStatus,
  settleTableOrders,
  deleteOrder,
} from '../controllers/orderController.js';
import auth from '../middleware/auth.js';

const router = Router();

// Public routes (for customer ordering)
router.post('/', createOrder);
router.get('/public/active/:tableNumber', getActiveTableOrders);

// Admin routes (for receptionist / kitchen management)
router.get('/admin', auth, getAdminOrders);
router.patch('/admin/:id/status', auth, updateOrderStatus);
router.patch('/admin/table/:tableNumber/settle', auth, settleTableOrders);
router.delete('/admin/:id', auth, deleteOrder);

export default router;
