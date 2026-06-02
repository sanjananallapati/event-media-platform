import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.middleware';
import {
  globalSearch,
  getAutocompleteSuggestions,
} from '../controllers/search.controller';

const router = Router();

router.get('/', optionalAuth, globalSearch);
router.get('/autocomplete', optionalAuth, getAutocompleteSuggestions);

export default router;
