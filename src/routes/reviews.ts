import { Router } from 'express';
import { createReview, getTutorReviews } from '../controllers/reviewController';
import { authMiddleware } from '../middleware/auth';
import { isStudent } from '../middleware/roleGuard';

const router = Router();

/**
 * POST /api/reviews
 * Create a review for a completed booking
 * Requires authentication and STUDENT role
 */
router.post('/', authMiddleware, isStudent, createReview);

/**
 * GET /api/reviews/tutor/:tutorId
 * Get all reviews for a specific tutor
 * Public route
 */
router.get('/tutor/:tutorId', getTutorReviews);

export default router;
