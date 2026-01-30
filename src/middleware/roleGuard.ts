import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if user has required role(s)
 * @param allowedRoles - Array of allowed roles
 * @returns Express middleware function
 */
export const roleGuard = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if user is authenticated (auth middleware should run first)
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
      return;
    }

    // Check if user's role is in the allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
      return;
    }

    next();
  };
};

// Convenience functions for common role checks
export const isStudent = roleGuard(['STUDENT']);
export const isTutor = roleGuard(['TUTOR']);
export const isAdmin = roleGuard(['ADMIN']);
export const isStudentOrTutor = roleGuard(['STUDENT', 'TUTOR']);
export const isTutorOrAdmin = roleGuard(['TUTOR', 'ADMIN']);
