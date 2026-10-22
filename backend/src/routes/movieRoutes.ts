/**
 * ============================================================================
 * MOVIE ROUTES (backend/src/routes/movieRoutes.ts)
 * ============================================================================
 */

import { Router } from 'express';
import {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie
} from '../controllers/movieController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public routes (anyone can browse movies & shows)
router.get('/', getAllMovies);
router.get('/:id', getMovieById);

// Admin-only routes (protected by requireAuth AND requireAdmin)
router.post('/', requireAuth, requireAdmin, createMovie);
router.put('/:id', requireAuth, requireAdmin, updateMovie);
router.delete('/:id', requireAuth, requireAdmin, deleteMovie);

export default router;
