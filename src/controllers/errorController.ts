import { Request, Response } from 'express';
import { z } from 'zod';

// Validation schema for error logs
const errorLogSchema = z.object({
  name: z.string().min(1, 'Error name is required'),
  message: z.string().min(1, 'Error message is required'),
  stack: z.string().optional(),
  componentStack: z.string().optional(),
  timestamp: z.string(),
  userAgent: z.string().default('unknown'),
  url: z.string().default('unknown')
});

/**
 * Log client-side errors
 * POST /api/errors
 */
export const logError = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = errorLogSchema.parse(req.body);

    // Log error details to console
    console.error('🔴 Frontend Error Logged:', {
      timestamp: validatedData.timestamp,
      name: validatedData.name,
      message: validatedData.message,
      url: validatedData.url,
      userAgent: validatedData.userAgent,
      stack: validatedData.stack ? validatedData.stack.substring(0, 200) + '...' : 'No stack trace',
      componentStack: validatedData.componentStack ? validatedData.componentStack.substring(0, 200) + '...' : 'No component stack'
    });

    // TODO: In production, you might want to:
    // 1. Store errors in database (add ErrorLog model to Prisma schema)
    // 2. Send to external error tracking service (Sentry, Bugsnag, etc.)
    // 3. Send alerts for critical errors
    // 4. Aggregate error statistics

    res.status(200).json({
      success: true,
      message: 'Error logged successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid error log data',
        details: error.errors
      });
      return;
    }

    console.error('Failed to log error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to log error'
    });
  }
};
