import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const userStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'BANNED'], {
    errorMap: () => ({ message: 'Status must be ACTIVE or BANNED' })
  })
});

const getUsersQuerySchema = z.object({
  role: z.enum(['STUDENT', 'TUTOR', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'BANNED']).optional(),
  search: z.string().optional()
});

const getBookingsQuerySchema = z.object({
  status: z.enum(['CONFIRMED', 'COMPLETED', 'CANCELLED']).optional(),
  search: z.string().optional()
});

/**
 * Get all users
 * GET /api/admin/users?role=&status=&search=
 * Requires authentication and ADMIN role
 */
export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Validate query parameters
    const validatedQuery = getUsersQuerySchema.parse(req.query);
    const { role, status, search } = validatedQuery;

    // Build filter conditions
    const where: any = {};

    if (role) {
      where.role = String(role).toUpperCase();
    }

    if (status) {
      where.status = String(status).toUpperCase();
    }

    if (search) {
      where.OR = [
        {
          name: {
            contains: String(search),
            mode: 'insensitive'
          }
        },
        {
          email: {
            contains: String(search),
            mode: 'insensitive'
          }
        }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        tutorProfile: {
          select: {
            id: true,
            rating: true,
            reviewCount: true
          }
        },
        _count: {
          select: {
            studentBookings: true,
            tutorBookings: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      users,
      count: users.length
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

    console.error('Get all users error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch users'
    });
  }
};

/**
 * Update user status (ban/unban)
 * PATCH /api/admin/users/:id/status
 * Requires authentication and ADMIN role
 */
export const updateUserStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate request body
    const validatedData = userStatusSchema.parse(req.body);
    const { status } = validatedData;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
      return;
    }

    // Prevent banning another admin
    if (user.role === 'ADMIN' && status === 'BANNED') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Cannot ban admin users'
      });
      return;
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true
      }
    });

    res.status(200).json({
      message: `User ${status === 'BANNED' ? 'banned' : 'unbanned'} successfully`,
      user: updatedUser
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

    console.error('Update user status error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user status'
    });
  }
};

/**
 * Get all bookings
 * GET /api/admin/bookings?status=&search=
 * Requires authentication and ADMIN role
 */
export const getAllBookings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Validate query parameters
    const validatedQuery = getBookingsQuerySchema.parse(req.query);
    const { status, search } = validatedQuery;

    // Build filter conditions
    const where: any = {};

    if (status) {
      where.status = String(status).toUpperCase();
    }

    if (search) {
      where.OR = [
        {
          student: {
            name: {
              contains: String(search),
              mode: 'insensitive'
            }
          }
        },
        {
          tutor: {
            name: {
              contains: String(search),
              mode: 'insensitive'
            }
          }
        }
      ];
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
                hourlyRate: true
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
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation Error',
        message: error.errors[0].message,
        details: error.errors
      });
      return;
    }

    console.error('Get all bookings error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch bookings'
    });
  }
};

/**
 * Get dashboard statistics
 * GET /api/admin/stats
 * Requires authentication and ADMIN role
 */
export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user counts by role
    const userStats = await prisma.user.groupBy({
      by: ['role'],
      _count: true
    });

    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: { status: 'ACTIVE' }
    });
    const bannedUsers = await prisma.user.count({
      where: { status: 'BANNED' }
    });

    // Get booking counts by status
    const bookingStats = await prisma.booking.groupBy({
      by: ['status'],
      _count: true
    });

    const totalBookings = await prisma.booking.count();

    // Get total tutors with profiles
    const totalTutors = await prisma.tutorProfile.count();

    // Get total reviews
    const totalReviews = await prisma.review.count();

    // Get total categories
    const totalCategories = await prisma.category.count();

    // Calculate total revenue (sum of completed booking durations * hourly rates)
    const completedBookings = await prisma.booking.findMany({
      where: { status: 'COMPLETED' },
      include: {
        tutor: {
          select: {
            tutorProfile: {
              select: {
                hourlyRate: true
              }
            }
          }
        }
      }
    });

    const totalRevenue = completedBookings.reduce((sum, booking) => {
      const hourlyRate = booking.tutor.tutorProfile?.hourlyRate || 0;
      const hours = booking.duration / 60;
      return sum + hourlyRate * hours;
    }, 0);

    // Get user counts by role for easy access
    const roleStats = userStats.reduce(
      (acc, stat) => {
        acc[stat.role.toLowerCase()] = stat._count;
        return acc;
      },
      {} as Record<string, number>
    );

    // Get booking counts by status for easy access
    const statusStats = bookingStats.reduce(
      (acc, stat) => {
        acc[stat.status.toLowerCase()] = stat._count;
        return acc;
      },
      {} as Record<string, number>
    );

    // Count active tutors (tutors with at least one booking)
    const activeTutors = await prisma.tutorProfile.count({
      where: {
        user: {
          tutorBookings: {
            some: {}
          }
        }
      }
    });

    res.status(200).json({
      totalUsers,
      totalTutors,
      totalStudents: roleStats.student || 0,
      totalBookings,
      totalRevenue,
      activeTutors,
      bookingsByStatus: {
        pending: statusStats.pending || 0,
        confirmed: statusStats.confirmed || 0,
        completed: statusStats.completed || 0,
        cancelled: statusStats.cancelled || 0
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch statistics'
    });
  }
};
