import { Router } from 'express';
import {
  getTutors,
  getTutorById,
  updateProfile,
  updateAvailability
} from '../controllers/tutorController';
import { authMiddleware } from '../middleware/auth';
import { isTutor } from '../middleware/roleGuard';

const router = Router();

/**
 * GET /api/tutors
 * Get all tutors with optional filters
 * Public route
 */
router.get('/', getTutors);

/**
 * GET /api/tutors/:id
 * Get single tutor by ID with reviews
 * Public route
 */
router.get('/:id', getTutorById);

/**
 * PUT /api/tutors/profile
 * Update tutor profile
 * Requires authentication and TUTOR role
 */
router.put('/profile', authMiddleware, isTutor, updateProfile);

/**
 * PUT /api/tutors/availability
 * Update tutor availability
 * Requires authentication and TUTOR role
 */
router.put('/availability', authMiddleware, isTutor, updateAvailability);

export default router;
