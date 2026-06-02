import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import {
  getDashboardAnalytics,
  getEventAnalytics,
  getUserAnalytics,
} from '../controllers/analytics.controller';

const router = Router();

router.get('/dashboard', authenticate, requireAdmin, getDashboardAnalytics);
router.get('/events/:id', authenticate, getEventAnalytics);
router.get('/me', authenticate, getUserAnalytics);

export default router;
