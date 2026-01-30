import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema for tutor profile update
const updateProfileSchema = z.object({
  bio: z.string().optional(),
  hourlyRate: z.number().positive('Hourly rate must be positive').optional(),
  subjects: z.array(z.string()).optional(),
  experience: z.number().min(0, 'Experience cannot be negative').optional(),
  availability: z.any().optional(), // JSON object for availability
  categories: z.array(z.string()).optional() // Array of category IDs
});

// Validation schema for availability update
const updateAvailabilitySchema = z.object({
  availability: z.any({
    required_error: 'Availability is required',
    invalid_type_error: 'Availability must be an object'
  })
});

/**
 * Get all tutors with filters
 * GET /api/tutors?category=&minRating=&maxPrice=&search=
 */
export const getTutors = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      category,
      minRating,
      maxPrice,
      search,
      sortBy = 'rating',
      order = 'desc'
    } = req.query;

    // Build filter conditions
    const where: any = {
      role: 'TUTOR',
      status: 'ACTIVE',
      tutorProfile: {
        isNot: null
      }
    };

    // Search by name
    if (search) {
      where.name = {
        contains: String(search),
        mode: 'insensitive'
      };
    }

    // Fetch tutors with profiles
    let tutors = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        tutorProfile: {
          select: {
            id: true,
            bio: true,
            hourlyRate: true,
            subjects: true,
            experience: true,
            rating: true,
            reviewCount: true,
            categories: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      }
    });

    // Filter by category
    if (category) {
      tutors = tutors.filter((tutor) =>
        tutor.tutorProfile?.categories.some(
          (cat) => cat.slug === String(category)
        )
      );
    }

    // Filter by rating
    if (minRating) {
      tutors = tutors.filter(
        (tutor) =>
          tutor.tutorProfile && tutor.tutorProfile.rating >= Number(minRating)
      );
    }

    // Filter by max price
    if (maxPrice) {
      tutors = tutors.filter(
        (tutor) =>
          tutor.tutorProfile && tutor.tutorProfile.hourlyRate <= Number(maxPrice)
      );
    }

    // Sort tutors
    if (sortBy === 'rating') {
      tutors.sort((a, b) => {
        const ratingA = a.tutorProfile?.rating || 0;
        const ratingB = b.tutorProfile?.rating || 0;
        return order === 'desc' ? ratingB - ratingA : ratingA - ratingB;
      });
    } else if (sortBy === 'price') {
      tutors.sort((a, b) => {
        const priceA = a.tutorProfile?.hourlyRate || 0;
        const priceB = b.tutorProfile?.hourlyRate || 0;
        return order === 'desc' ? priceB - priceA : priceA - priceB;
      });
    }

    res.status(200).json({
      tutors,
      count: tutors.length
    });
  } catch (error) {
    console.error('Get tutors error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch tutors'
    });
  }
};

/**
 * Get single tutor by ID with reviews
 * GET /api/tutors/:id
 */
export const getTutorById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const tutor = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        tutorProfile: {
          select: {
            id: true,
            bio: true,
            hourlyRate: true,
            subjects: true,
            experience: true,
            availability: true,
            rating: true,
            reviewCount: true,
            categories: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true
              }
            }
          }
        },
        tutorReviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            student: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 20
        }
      }
    });

    if (!tutor || tutor.tutorProfile === null) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Tutor not found'
      });
      return;
    }

    res.status(200).json({ tutor });
  } catch (error) {
    console.error('Get tutor by ID error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch tutor'
    });
  }
};

/**
 * Update tutor profile
 * PUT /api/tutors/profile
 * Requires authentication and TUTOR role
 */
export const updateProfile = async (
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
    const validatedData = updateProfileSchema.parse(req.body);

    // Check if tutor profile exists
    const existingProfile = await prisma.tutorProfile.findUnique({
      where: { userId: req.user.userId }
    });

    let profile;
    const { categories, ...profileData } = validatedData;

    if (existingProfile) {
      // Update existing profile
      profile = await prisma.tutorProfile.update({
        where: { userId: req.user.userId },
        data: {
          ...profileData,
          ...(categories && {
            categories: {
              set: categories.map((catId) => ({ id: catId }))
            }
          })
        },
        include: {
          categories: true
        }
      });
    } else {
      // Create new profile
      profile = await prisma.tutorProfile.create({
        data: {
          userId: req.user.userId,
          hourlyRate: validatedData.hourlyRate || 0,
          ...profileData,
          ...(categories && {
            categories: {
              connect: categories.map((catId) => ({ id: catId }))
            }
          })
        },
        include: {
          categories: true
        }
      });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      profile
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

    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update profile'
    });
  }
};

/**
 * Update tutor availability
 * PUT /api/tutors/availability
 * Requires authentication and TUTOR role
 */
export const updateAvailability = async (
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
    const validatedData = updateAvailabilitySchema.parse(req.body);
    const { availability } = validatedData;

    const profile = await prisma.tutorProfile.update({
      where: { userId: req.user.userId },
      data: { availability }
    });

    res.status(200).json({
      message: 'Availability updated successfully',
      profile
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

    console.error('Update availability error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update availability'
    });
  }
};
