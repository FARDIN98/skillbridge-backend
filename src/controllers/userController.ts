import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { hashPassword, comparePassword } from '../utils/password';

const prisma = new PrismaClient();

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format')
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

/**
 * Update user profile (name and email)
 * PUT /api/users/profile
 * Requires authentication
 */
export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated'
      });
      return;
    }

    // Validate request body
    const validatedData = updateProfileSchema.parse(req.body);

    // Check if email is already taken by another user
    if (validatedData.email !== req.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email }
      });

      if (existingUser && existingUser.id !== req.user.userId) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Email is already taken by another user'
        });
        return;
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        name: validatedData.name,
        email: validatedData.email
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(200).json({
      message: 'Profile updated successfully',
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

    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update profile'
    });
  }
};

/**
 * Update user password
 * PUT /api/users/password
 * Requires authentication
 */
export const updatePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated'
      });
      return;
    }

    // Validate request body
    const validatedData = updatePasswordSchema.parse(req.body);

    // Get user's current password from database
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { password: true }
    });

    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
      return;
    }

    // Verify current password
    const isPasswordValid = await comparePassword(
      validatedData.currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Current password is incorrect'
      });
      return;
    }

    // Hash new password
    const hashedPassword = await hashPassword(validatedData.newPassword);

    // Update password
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { password: hashedPassword }
    });

    res.status(200).json({
      message: 'Password updated successfully'
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

    console.error('Update password error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update password'
    });
  }
};
