import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import {
  requestRoleUpgrade,
  getMyRoleRequests,
  getAllRoleRequests,
  approveRoleRequest,
  rejectRoleRequest,
  getRoleRequestStats,
} from '../controllers/roleRequest.controller';

const router = Router();

// ── User routes (any authenticated user) ────────────────────────────────────
router.post(
  '/',
  authenticate,
  validate([
    body('requestedRole')
      .isIn(['CLUB_MEMBER', 'PHOTOGRAPHER'])
      .withMessage('Requested role must be CLUB_MEMBER or PHOTOGRAPHER'),
    body('remarks')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Remarks must be under 500 characters'),
  ]),
  requestRoleUpgrade
);

router.get('/my', authenticate, getMyRoleRequests);

// ── Admin routes ─────────────────────────────────────────────────────────────
router.get('/stats', authenticate, requireAdmin, getRoleRequestStats);
router.get('/', authenticate, requireAdmin, getAllRoleRequests);

router.patch(
  '/:id/approve',
  authenticate,
  requireAdmin,
  approveRoleRequest
);

router.patch(
  '/:id/reject',
  authenticate,
  requireAdmin,
  validate([
    body('remarks')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Remarks must be under 500 characters'),
  ]),
  rejectRoleRequest
);

export default router;
