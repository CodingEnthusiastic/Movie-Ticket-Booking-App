/**
 * ============================================================================
 * AUTH ROUTES (backend/src/routes/authRoutes.ts)
 * ============================================================================
 */

import { Router } from 'express';
import { signup, login, getMe } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes (requires valid JWT token)
router.get('/me', requireAuth, getMe);

export default router;
