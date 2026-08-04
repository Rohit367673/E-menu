import { Router } from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from '../controllers/categoryController.js';
import auth from '../middleware/auth.js';

const router = Router();

router.get('/', auth, getCategories);

router.post('/', auth, createCategory);

// Reorder must come before :id routes to avoid conflict
router.put('/reorder', auth, reorderCategories);

router.put('/:id', auth, updateCategory);

router.delete('/:id', auth, deleteCategory);

export default router;
