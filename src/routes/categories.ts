import { Router } from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController';
import { authMiddleware } from '../middleware/auth';
import { isAdmin } from '../middleware/roleGuard';

const router = Router();

/**
 * GET /api/categories
 * Get all categories
 * Public route
 */
router.get('/', getCategories);

/**
 * POST /api/categories
 * Create a new category
 * Requires authentication and ADMIN role
 */
router.post('/', authMiddleware, isAdmin, createCategory);

/**
 * PUT /api/categories/:id
 * Update a category
 * Requires authentication and ADMIN role
 */
router.put('/:id', authMiddleware, isAdmin, updateCategory);

/**
 * DELETE /api/categories/:id
 * Delete a category
 * Requires authentication and ADMIN role
 */
router.delete('/:id', authMiddleware, isAdmin, deleteCategory);

export default router;
