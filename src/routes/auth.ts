import { Router } from 'express';
import { register, login, getCurrentUser } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user (student or tutor)
 */
router.post('/register', register);

/**
 * POST /api/auth/login
 * Login user and get JWT token
 */
router.post('/login', login);

/**
 * GET /api/auth/me
 * Get current authenticated user's profile
 * Requires authentication
 */
router.get('/me', authMiddleware, getCurrentUser);

export default router;
