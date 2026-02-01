import { Router } from 'express';
import { logError } from '../controllers/errorController';

const router = Router();

/**
 * POST /api/errors
 * Log client-side errors from ErrorBoundary
 */
router.post('/', logError);

export default router;
