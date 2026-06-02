import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware';
import { authenticate, optionalAuth, requireRole } from '../middleware/auth.middleware';
import { uploadSingle } from '../middleware/upload.middleware';
import multer from 'multer';
import {
  createEvent,
  getEvents,
  getEventBySlug,
  updateEvent,
  deleteEvent,
  getEventMedia,
  generateQRCode,
} from '../controllers/event.controller';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

router.get('/', optionalAuth, getEvents);
router.get('/:slug', optionalAuth, getEventBySlug);
router.get('/:slug/media', optionalAuth, getEventMedia);
router.get('/:slug/qr', authenticate, generateQRCode);

router.post(
  '/',
  authenticate,
  requireRole('ADMIN', 'PHOTOGRAPHER', 'CLUB_MEMBER'),
  upload.single('cover'),
  validate([
    body('name').isLength({ min: 2 }).withMessage('Event name required'),
    body('startDate').isISO8601().withMessage('Valid start date required'),
  ]),
  createEvent
);

router.put(
  '/:id',
  authenticate,
  upload.single('cover'),
  updateEvent
);

router.delete('/:id', authenticate, deleteEvent);

export default router;
