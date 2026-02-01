import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema for creating booking
const createBookingSchema = z.object({
  tutorId: z.string().uuid('Invalid tutor ID'),
  dateTime: z.string().datetime('Invalid date time format'),
  duration: z.number().positive('Duration must be positive').default(60),
  subject: z.string().optional(),
  notes: z.string().min(1, 'Message is required').optional()
});

// Validation schema for updating booking status
const updateBookingStatusSchema = z.object({
  action: z.enum(['approve', 'reject', 'cancel', 'complete'], {
    errorMap: () => ({ message: 'Action must be approve, reject, cancel, or complete' })
  }),
  reason: z.string().optional() // Optional reason for rejection/cancellation
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
        subject: validatedData.subject,
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
      message: 'Booking request sent! Awaiting tutor approval.',
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
 *
 * Actions:
 * - approve: PENDING → CONFIRMED (tutor only)
 * - reject: PENDING → REJECTED (tutor only)
 * - cancel: PENDING/CONFIRMED → CANCELLED (student or tutor)
 * - complete: CONFIRMED → COMPLETED (tutor only)
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

    // Validate request body
    const validatedData = updateBookingStatusSchema.parse(req.body);
    const { action, reason } = validatedData;

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

    let newStatus: string;
    let message: string;
    let updateData: any = {};

    // Handle different actions
    switch (action) {
      case 'approve':
        // Only tutor can approve
        if (booking.tutorId !== req.user.userId) {
          res.status(403).json({
            error: 'Forbidden',
            message: 'Only the tutor can approve bookings'
          });
          return;
        }

        // Can only approve PENDING bookings
        if (booking.status !== 'PENDING') {
          res.status(400).json({
            error: 'Bad Request',
            message: `Cannot approve booking with status ${booking.status}`
          });
          return;
        }

        newStatus = 'CONFIRMED';
        message = 'Booking approved successfully';
        updateData = { status: newStatus };
        break;

      case 'reject':
        // Only tutor can reject
        if (booking.tutorId !== req.user.userId) {
          res.status(403).json({
            error: 'Forbidden',
            message: 'Only the tutor can reject bookings'
          });
          return;
        }

        // Can only reject PENDING bookings
        if (booking.status !== 'PENDING') {
          res.status(400).json({
            error: 'Bad Request',
            message: `Cannot reject booking with status ${booking.status}`
          });
          return;
        }

        newStatus = 'REJECTED';
        message = 'Booking rejected';
        // If reason provided, append to notes
        updateData = {
          status: newStatus,
          notes: reason ? `${booking.notes ? booking.notes + '\n\n' : ''}[REJECTION REASON]\n${reason}` : booking.notes
        };
        break;

      case 'cancel':
        // Student or tutor can cancel
        const isStudent = booking.studentId === req.user.userId;
        const isTutor = booking.tutorId === req.user.userId;

        if (!isStudent && !isTutor) {
          res.status(403).json({
            error: 'Forbidden',
            message: 'Only the student or tutor can cancel this booking'
          });
          return;
        }

        // Can only cancel PENDING or CONFIRMED bookings
        if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
          res.status(400).json({
            error: 'Bad Request',
            message: `Cannot cancel booking with status ${booking.status}`
          });
          return;
        }

        newStatus = 'CANCELLED';
        message = 'Booking cancelled successfully';
        // If reason provided, append to notes
        updateData = {
          status: newStatus,
          notes: reason ? `${booking.notes ? booking.notes + '\n\n' : ''}[CANCELLATION REASON]\n${reason}` : booking.notes
        };
        break;

      case 'complete':
        // Only tutor can mark as completed
        if (booking.tutorId !== req.user.userId) {
          res.status(403).json({
            error: 'Forbidden',
            message: 'Only the tutor can mark bookings as completed'
          });
          return;
        }

        // Can only complete CONFIRMED bookings
        if (booking.status !== 'CONFIRMED') {
          res.status(400).json({
            error: 'Bad Request',
            message: `Cannot complete booking with status ${booking.status}`
          });
          return;
        }

        // Optional: Check if booking time has passed
        if (new Date() < booking.dateTime) {
          res.status(400).json({
            error: 'Bad Request',
            message: 'Cannot mark booking as completed before the scheduled time'
          });
          return;
        }

        newStatus = 'COMPLETED';
        message = 'Booking marked as completed';
        updateData = { status: newStatus };
        break;

      default:
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid action'
        });
        return;
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
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

    res.status(200).json({
      message,
      booking: updatedBooking
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

    console.error('Update booking status error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update booking status'
    });
  }
};
