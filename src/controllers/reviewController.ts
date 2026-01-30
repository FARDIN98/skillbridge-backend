import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema for creating review
const createReviewSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().optional()
});

/**
 * Create a review
 * POST /api/reviews
 * Requires authentication and STUDENT role
 */
export const createReview = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated'
      });
      return;
    }

    // Validate request body
    const validatedData = createReviewSchema.parse(req.body);

    // Check if booking exists and belongs to the student
    const booking = await prisma.booking.findUnique({
      where: { id: validatedData.bookingId },
      include: { review: true }
    });

    if (!booking) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Booking not found'
      });
      return;
    }

    // Check if booking belongs to the student
    if (booking.studentId !== req.user.userId) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You can only review your own bookings'
      });
      return;
    }

    // Check if booking is completed
    if (booking.status !== 'COMPLETED') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'You can only review completed bookings'
      });
      return;
    }

    // Check if review already exists
    if (booking.review) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'You have already reviewed this booking'
      });
      return;
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        bookingId: validatedData.bookingId,
        studentId: req.user.userId,
        tutorId: booking.tutorId,
        rating: validatedData.rating,
        comment: validatedData.comment
      },
      include: {
        student: {
          select: {
            id: true,
            name: true
          }
        },
        tutor: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Update tutor's average rating and review count
    const tutorReviews = await prisma.review.findMany({
      where: { tutorId: booking.tutorId },
      select: { rating: true }
    });

    const avgRating =
      tutorReviews.reduce((sum, r) => sum + r.rating, 0) / tutorReviews.length;

    await prisma.tutorProfile.update({
      where: { userId: booking.tutorId },
      data: {
        rating: avgRating,
        reviewCount: tutorReviews.length
      }
    });

    res.status(201).json({
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation Error',
        message: error.errors[0].message,
        details: error.errors
      });
      return;
    }

    console.error('Create review error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create review'
    });
  }
};

/**
 * Get reviews for a tutor
 * GET /api/reviews/tutor/:tutorId
 * Public route
 */
export const getTutorReviews = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { tutorId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { tutorId },
      include: {
        student: {
          select: {
            id: true,
            name: true
          }
        },
        booking: {
          select: {
            dateTime: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate rating distribution
    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };

    reviews.forEach((review) => {
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    });

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    res.status(200).json({
      reviews,
      count: reviews.length,
      avgRating,
      ratingDistribution
    });
  } catch (error) {
    console.error('Get tutor reviews error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch reviews'
    });
  }
};
