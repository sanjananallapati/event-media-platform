import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import multer from 'multer';
import {
  createStory,
  getActiveStories,
  viewStory,
  deleteStory,
} from '../controllers/story.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const router = Router();

router.get('/', authenticate, getActiveStories);
router.post('/', authenticate, upload.single('file'), createStory);
router.patch('/:id/view', authenticate, viewStory);
router.delete('/:id', authenticate, deleteStory);

export default router;
