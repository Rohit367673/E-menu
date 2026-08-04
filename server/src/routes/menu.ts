import { Router } from 'express';
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  reorderMenuItems,
  toggleAvailability,
} from '../controllers/menuController.js';
import auth from '../middleware/auth.js';

const router = Router();

router.get('/', auth, getMenuItems);

router.post('/', auth, createMenuItem);

// Reorder must come before :id routes to avoid conflict
router.put('/reorder', auth, reorderMenuItems);

router.put('/:id', auth, updateMenuItem);

router.delete('/:id', auth, deleteMenuItem);

router.patch('/:id/toggle', auth, toggleAvailability);

export default router;
