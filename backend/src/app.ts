/**
 * ============================================================================
 * EXPRESS APP CONFIGURATION (backend/src/app.ts)
 * ============================================================================
 *
 * Configures CORS, JSON parsing, API routes, and error handling.
 * Kept separate from server.ts so it can be imported by Jest supertest suites.
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import movieRoutes from './routes/movieRoutes.js';
import showRoutes from './routes/showRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import { initDatabase } from './db/database.js';

// Ensure tables exist
initDatabase();

export const app = express();

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'Yozigo Cinema API', time: new Date().toISOString() });
});
