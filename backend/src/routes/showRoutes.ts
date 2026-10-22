/**
 * ============================================================================
 * SHOW ROUTES (backend/src/routes/showRoutes.ts)
 * ============================================================================
 */

import { Router } from 'express';
import {
  getShowSeats,
  createShow,
  deleteShow,
  getAdminShowStats,
  getShowAdminDetails
} from '../controllers/showController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, AuthUserPayload } from '../middleware/auth.js';

const router = Router();

// Middleware to optionally extract logged-in user if token is present
// (so getShowSeats can determine if a held seat is held by current user)
function optionalAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
      req.user = decoded;
    } catch (e) {
      // Ignore token parse failure on optional routes
    }
  }
  next();
}

// Seat map for a show (public or customer)
router.get('/:id/seats', optionalAuth, getShowSeats);

// Admin-only show management and analytics
router.get('/admin/stats', requireAuth, requireAdmin, getAdminShowStats);
router.get('/:id/admin-details', requireAuth, requireAdmin, getShowAdminDetails);
router.post('/', requireAuth, requireAdmin, createShow);
router.delete('/:id', requireAuth, requireAdmin, deleteShow);

export default router;
