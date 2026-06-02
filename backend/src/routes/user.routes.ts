import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { uploadAvatar, uploadSelfie } from '../middleware/upload.middleware';
import {
  getProfile,
  updateProfile,
  updateAvatar,
  uploadSelfieForFaceRecognition,
  getMyPhotos,
  changePassword,
  getAllUsers,
  updateUserRole,
} from '../controllers/user.controller';

const router = Router();

router.get('/profile/:username', getProfile);
router.get('/me/photos', authenticate, getMyPhotos);

router.put(
  '/profile',
  authenticate,
  validate([
    body('fullName').optional().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
    body('username').optional().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  ]),
  updateProfile
);

router.post('/avatar', authenticate, uploadAvatar, updateAvatar);
router.post('/selfie', authenticate, uploadSelfie, uploadSelfieForFaceRecognition);

router.put(
  '/password',
  authenticate,
  validate([
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ]),
  changePassword
);

// Admin routes
router.get('/', authenticate, requireAdmin, getAllUsers);
router.patch('/:id/role', authenticate, requireAdmin, updateUserRole);

export default router;
