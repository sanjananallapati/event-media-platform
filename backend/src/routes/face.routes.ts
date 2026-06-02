import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import multer from 'multer';
import {
  findMyPhotos,
  searchByFaceImage,
} from '../controllers/face.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = Router();

router.get('/my-photos', authenticate, findMyPhotos);
router.post('/search', authenticate, upload.single('image'), searchByFaceImage);

export default router;
