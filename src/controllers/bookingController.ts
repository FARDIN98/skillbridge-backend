import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema for creating booking
const createBookingSchema = z.object({
  tutorId: z.string().uuid('Invalid tutor ID'),
  dateTime: z.string().datetime('Invalid date time format'),
  duration: z.number().positive('Duration must be positive').default(60),
  notes: z.string().optional()
});

/**
 * Create a new booking
 * POST /api/bookings
 * Requires authentication and STUDENT role
 */
export const createBooking = async (
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
    const validatedData = createBookingSchema.parse(req.body);

    // Check if tutor exists and is active
    const tutor = await prisma.user.findUnique({
      where: { id: validatedData.tutorId },
      include: { tutorProfile: true }
    });

    if (!tutor || tutor.role !== 'TUTOR' || !tutor.tutorProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Tutor not found'
      });
      return;
    }

    if (tutor.status === 'BANNED') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'This tutor is not available'
      });
      return;
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        studentId: req.user.userId,
        tutorId: validatedData.tutorId,
        dateTime: new Date(validatedData.dateTime),
        duration: validatedData.duration,
        notes: validatedData.notes
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tutor: {
          select: {
            id: true,
            name: true,
            email: true,
            tutorProfile: {
              select: {
                hourlyRate: true,
                subjects: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      message: 'Booking created successfully',
      booking
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

    console.error('Create booking error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create booking'
    });
  }
};

/**
 * Get user's bookings (role-specific)
 * GET /api/bookings
 * Requires authentication
 */
export const getBookings = async (
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

    const { status } = req.query;

    // Build filter based on user role
    const where: any = {};

    if (req.user.role === 'STUDENT') {
      where.studentId = req.user.userId;
    } else if (req.user.role === 'TUTOR') {
      where.tutorId = req.user.userId;
    } else {
      // Admin can see all bookings
      // No additional filter
    }

    if (status) {
      where.status = String(status).toUpperCase();
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tutor: {
          select: {
            id: true,
            name: true,
            email: true,
            tutorProfile: {
              select: {
                hourlyRate: true,
                subjects: true
              }
            }
          }
        },
        review: {
          select: {
            id: true,
            rating: true,
            comment: true
          }
        }
      },
      orderBy: {
        dateTime: 'desc'
      }
    });

    res.status(200).json({
      bookings,
      count: bookings.length
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch bookings'
    });
  }
};

/**
 * Get single booking by ID
 * GET /api/bookings/:id
 * Requires authentication
 */
export const getBookingById = async (
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

    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tutor: {
          select: {
            id: true,
            name: true,
            email: true,
            tutorProfile: {
              select: {
                hourlyRate: true,
                subjects: true,
                bio: true
              }
            }
          }
        },
        review: true
      }
    });

    if (!booking) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Booking not found'
      });
      return;
    }

    // Check if user has access to this booking
    if (
      req.user.role !== 'ADMIN' &&
      booking.studentId !== req.user.userId &&
      booking.tutorId !== req.user.userId
    ) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this booking'
      });
      return;
    }

    res.status(200).json({ booking });
  } catch (error) {
    console.error('Get booking by ID error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch booking'
    });
  }
};

/**
 * Update booking status
 * PATCH /api/bookings/:id/status
 * Requires authentication
 */
export const updateBookingStatus = async (
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

    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(status)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid status value'
      });
      return;
    }

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id }
    });

    if (!booking) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Booking not found'
      });
      return;
    }

    // Check permissions
    // Students can cancel, tutors can mark as completed
    if (status === 'CANCELLED' && booking.studentId !== req.user.userId) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only students can cancel bookings'
      });
      return;
    }

    if (status === 'COMPLETED' && booking.tutorId !== req.user.userId) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only tutors can mark bookings as completed'
      });
      return;
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tutor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(200).json({
      message: 'Booking status updated successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update booking status'
    });
  }
};
