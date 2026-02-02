import { Router } from 'express';
import { updateProfile, updatePassword } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * PUT /api/users/profile
 * Update user profile (name and email)
 * Requires authentication
 */
router.put('/profile', authMiddleware, updateProfile);

/**
 * PUT /api/users/password
 * Update user password
 * Requires authentication
 */
router.put('/password', authMiddleware, updatePassword);

export default router;
