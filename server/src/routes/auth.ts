import { Router } from 'express';
import { body } from 'express-validator';
import { login, getMe } from '../controllers/authController.js';
import auth from '../middleware/auth.js';

const router = Router();

router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  login
);

router.get('/me', auth, getMe);

export default router;
