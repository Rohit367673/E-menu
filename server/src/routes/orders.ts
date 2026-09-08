import { Router } from 'express';
import {
  createOrder,
  getActiveTableOrders,
  getAdminOrders,
  updateOrderStatus,
  settleTableOrders,
  resetTableSession,
  deleteOrder,
  getMonthlyEarningsReport,
  requestTableBill,
  dismissBillRequest,
  getKOTData,
  claimPrintJob,
  markKOTPrinted,
  markKOTFailed,
} from '../controllers/orderController.js';
import auth from '../middleware/auth.js';

const router = Router();

// Public routes (for customer ordering)
router.post('/', createOrder);
router.get('/public/active/:tableNumber', getActiveTableOrders);
router.post('/public/table/:tableNumber/request-bill', requestTableBill);

// Admin routes (for receptionist / kitchen management)
router.get('/admin', auth, getAdminOrders);
router.get('/admin/kot/:orderId', auth, getKOTData);
router.post('/admin/kot/:orderId/claim', auth, claimPrintJob);
router.patch('/admin/kot/:orderId/printed', auth, markKOTPrinted);
router.patch('/admin/kot/:orderId/failed', auth, markKOTFailed);
router.get('/admin/earnings/monthly', auth, getMonthlyEarningsReport);
router.patch('/admin/:id/status', auth, updateOrderStatus);
router.patch('/admin/table/:tableNumber/settle', auth, settleTableOrders);
router.patch('/admin/table/:tableNumber/dismiss-bill-request', auth, dismissBillRequest);
router.post('/admin/table/:tableNumber/reset', auth, resetTableSession);
router.delete('/admin/:id', auth, deleteOrder);

export default router;
