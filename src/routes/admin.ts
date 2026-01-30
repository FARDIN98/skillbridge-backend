import { Router } from 'express';
import {
  getAllUsers,
  updateUserStatus,
  getAllBookings,
  getStats
} from '../controllers/adminController';
import { authMiddleware } from '../middleware/auth';
import { isAdmin } from '../middleware/roleGuard';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authMiddleware, isAdmin);

/**
 * GET /api/admin/users
 * Get all users with filters
 */
router.get('/users', getAllUsers);

/**
 * PATCH /api/admin/users/:id/status
 * Update user status (ban/unban)
 */
router.patch('/users/:id/status', updateUserStatus);

/**
 * GET /api/admin/bookings
 * Get all bookings with filters
 */
router.get('/bookings', getAllBookings);

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
router.get('/stats', getStats);

export default router;
