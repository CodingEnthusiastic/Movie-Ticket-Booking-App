/**
 * ============================================================================
 * BOOKING ROUTES (backend/src/routes/bookingRoutes.ts)
 * ============================================================================
 */

import { Router } from 'express';
import {
  holdSeats,
  confirmBooking,
  getMyBookings,
  cancelBooking
} from '../controllers/bookingController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All booking operations require an authenticated user
router.use(requireAuth);

// Flow 4: Hold 1-6 seats for 5 minutes
router.post('/hold', holdSeats);

// Flow 5: Payment success confirmation
router.post('/confirm', confirmBooking);

// Flow 6: View user's bookings (upcoming first, then past)
router.get('/my-bookings', getMyBookings);

// Bonus Flow 8: Cancel booking (up to 2 hours before show)
router.post('/:id/cancel', cancelBooking);

export default router;
