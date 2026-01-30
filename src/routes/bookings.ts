import { Router } from 'express';
import {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus
} from '../controllers/bookingController';
import { authMiddleware } from '../middleware/auth';
import { isStudent } from '../middleware/roleGuard';

const router = Router();

/**
 * POST /api/bookings
 * Create a new booking
 * Requires authentication and STUDENT role
 */
router.post('/', authMiddleware, isStudent, createBooking);

/**
 * GET /api/bookings
 * Get user's bookings (role-specific)
 * Requires authentication
 */
router.get('/', authMiddleware, getBookings);

/**
 * GET /api/bookings/:id
 * Get single booking by ID
 * Requires authentication
 */
router.get('/:id', authMiddleware, getBookingById);

/**
 * PATCH /api/bookings/:id/status
 * Update booking status (complete/cancel)
 * Requires authentication
 */
router.patch('/:id/status', authMiddleware, updateBookingStatus);

export default router;
