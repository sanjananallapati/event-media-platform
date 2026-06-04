import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  register,
  login,
  refreshToken,
  logout,
  getMe,
} from '../controllers/auth.controller';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  validate([
    body('email').isEmail().withMessage('Valid email required'),
    body('username')
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be 3-30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('fullName')
      .isLength({ min: 2 })
      .withMessage('Full name is required'),
  ]),
  register
);

// POST /api/auth/login
router.post(
  '/login',
  validate([
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  login
);

// POST /api/auth/refresh
router.post('/refresh', refreshToken);

// POST /api/auth/logout — does NOT require authenticate so expired tokens can still log out
router.post('/logout', logout);

// GET /api/auth/me
router.get('/me', authenticate, getMe);

export default router;
