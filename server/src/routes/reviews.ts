import { Router } from 'express';
import {
  submitReview,
  getPublicReviews,
  getAdminReviews,
  deleteReview,
} from '../controllers/reviewController.js';
import auth from '../middleware/auth.js';

const router = Router();

// Public routes
router.post('/', submitReview);
router.get('/public', getPublicReviews);
router.get('/public/:slug', getPublicReviews);

// Admin routes
router.get('/admin', auth, getAdminReviews);
router.delete('/:id', auth, deleteReview);

export default router;
