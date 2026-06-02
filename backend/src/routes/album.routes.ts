import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import multer from 'multer';
import {
  createAlbum,
  getAlbums,
  getAlbumById,
  updateAlbum,
  deleteAlbum,
  addCollaborator,
  removeCollaborator,
} from '../controllers/album.controller';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

router.get('/', getAlbums);
router.get('/:id', getAlbumById);

router.post(
  '/',
  authenticate,
  requireRole('ADMIN', 'PHOTOGRAPHER', 'CLUB_MEMBER'),
  upload.single('cover'),
  validate([
    body('name').isLength({ min: 2 }).withMessage('Album name required'),
  ]),
  createAlbum
);

router.put('/:id', authenticate, upload.single('cover'), updateAlbum);
router.delete('/:id', authenticate, deleteAlbum);

router.post('/:id/collaborators', authenticate, addCollaborator);
router.delete('/:id/collaborators/:userId', authenticate, removeCollaborator);

export default router;
