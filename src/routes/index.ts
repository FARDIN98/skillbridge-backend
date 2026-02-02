import { Router } from 'express';
import authRoutes from './auth';
import tutorRoutes from './tutors';
import bookingRoutes from './bookings';
import reviewRoutes from './reviews';
import categoryRoutes from './categories';
import adminRoutes from './admin';
import errorRoutes from './errors';
import userRoutes from './users';

const router = Router();

// Mount all route modules
router.use('/auth', authRoutes);
router.use('/tutors', tutorRoutes);
router.use('/bookings', bookingRoutes);
router.use('/reviews', reviewRoutes);
router.use('/categories', categoryRoutes);
router.use('/admin', adminRoutes);
router.use('/errors', errorRoutes);
router.use('/users', userRoutes);

// Health check for API
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

export default router;
