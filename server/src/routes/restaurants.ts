import { Router } from 'express';
import {
  getRestaurant,
  updateRestaurant,
  updateTemplate,
  getPublicMenu,
} from '../controllers/restaurantController.js';
import auth from '../middleware/auth.js';

const router = Router();

// Admin endpoints
router.get('/me', auth, getRestaurant);
router.put('/me', auth, updateRestaurant);
router.put('/me/template', auth, updateTemplate);

// Public digital menu endpoints
router.get('/public', getPublicMenu);
router.get('/:slug/public', getPublicMenu);
router.get('/:slug/menu', getPublicMenu);

export default router;
