import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware';
import { authenticate, optionalAuth, requireRole } from '../middleware/auth.middleware';
import { uploadMultiple, uploadSingle } from '../middleware/upload.middleware';
import multer from 'multer';
import {
  uploadMedia,
  getMediaById,
  deleteMedia,
  likeMedia,
  addComment,
  getComments,
  toggleFavourite,
  getFavourites,
  shareMedia,
  downloadMedia,
  tagUser,
  untagUser,
} from '../controllers/media.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024, files: 50 },
});

const router = Router();

router.get('/favourites', authenticate, getFavourites);
router.get('/:id', optionalAuth, getMediaById);
router.get('/:id/comments', optionalAuth, getComments);
router.get('/:id/download', optionalAuth, downloadMedia);

router.post(
  '/upload',
  authenticate,
  requireRole('ADMIN', 'PHOTOGRAPHER', 'CLUB_MEMBER'),
  upload.array('files', 50),
  uploadMedia
);

router.delete('/:id', authenticate, deleteMedia);

router.post('/:id/like', authenticate, likeMedia);
router.post('/:id/favourite', authenticate, toggleFavourite);
router.post('/:id/share', authenticate, shareMedia);

router.post(
  '/:id/comments',
  authenticate,
  validate([
    body('content').isLength({ min: 1 }).withMessage('Comment content required'),
  ]),
  addComment
);

router.post(
  '/:id/tag',
  authenticate,
  validate([
    body('taggedUserId').notEmpty().withMessage('User ID required'),
  ]),
  tagUser
);

router.delete('/:id/tag/:taggedUserId', authenticate, untagUser);

export default router;
