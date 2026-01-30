import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema for category
const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens').optional()
});

// Helper function to generate slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
};

/**
 * Get all categories
 * GET /api/categories
 * Public route
 */
export const getCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { tutors: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.status(200).json({
      categories,
      count: categories.length
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch categories'
    });
  }
};

/**
 * Create a category
 * POST /api/categories
 * Requires authentication and ADMIN role
 */
export const createCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Validate request body
    const validatedData = categorySchema.parse(req.body);

    // Auto-generate slug from name if not provided
    const slug = validatedData.slug || generateSlug(validatedData.name);

    // Check if category with same name or slug exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { name: validatedData.name },
          { slug: slug }
        ]
      }
    });

    if (existingCategory) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Category with this name or slug already exists'
      });
      return;
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        ...validatedData,
        slug
      }
    });

    res.status(201).json({
      message: 'Category created successfully',
      category
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

    console.error('Create category error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create category'
    });
  }
};

/**
 * Update a category
 * PUT /api/categories/:id
 * Requires authentication and ADMIN role
 */
export const updateCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate request body
    const validatedData = categorySchema.partial().parse(req.body);

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Category not found'
      });
      return;
    }

    // Update category
    const category = await prisma.category.update({
      where: { id },
      data: validatedData
    });

    res.status(200).json({
      message: 'Category updated successfully',
      category
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

    console.error('Update category error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update category'
    });
  }
};

/**
 * Delete a category
 * DELETE /api/categories/:id
 * Requires authentication and ADMIN role
 */
export const deleteCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { tutors: true }
        }
      }
    });

    if (!existingCategory) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Category not found'
      });
      return;
    }

    // Check if category has associated tutors
    if (existingCategory._count.tutors > 0) {
      res.status(400).json({
        error: 'Bad Request',
        message: `Cannot delete category with ${existingCategory._count.tutors} associated tutors`
      });
      return;
    }

    // Delete category
    await prisma.category.delete({
      where: { id }
    });

    res.status(200).json({
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete category'
    });
  }
};
