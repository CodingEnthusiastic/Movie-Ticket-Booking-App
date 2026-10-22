/**
 * ============================================================================
 * AUTHENTICATION & AUTHORIZATION MIDDLEWARE (backend/src/middleware/auth.ts)
 * ============================================================================
 *
 * For vibe coders:
 * A "middleware" in Express is like a security guard standing at a door.
 * Every incoming HTTP request passes through this function BEFORE reaching
 * the route controller.
 *
 * - requireAuth: Checks if the user sent a valid JWT (JSON Web Token) in the
 *   "Authorization: Bearer <token>" header. If valid, it attaches `req.user`.
 *   If not valid, it blocks the request with a 401 Unauthorized status.
 *
 * - requireAdmin: Checks if the logged-in user has role === 'admin'.
 *   If not, it blocks with 403 Forbidden.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'yozigo-cinema-super-secret-key-2026';

// Define the payload structure stored inside the JWT token
export interface AuthUserPayload {
  id: number;
  email: string;
  name: string;
  role: 'customer' | 'admin';
}

// Extend Express Request type so TypeScript knows `req.user` exists
declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

/**
 * Middleware: Verify that the user is logged in
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
    req.user = decoded; // Attach user information to request object
    next(); // All good! Pass control to the next handler
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
    return;
  }
}

/**
 * Middleware: Verify that the logged-in user is an Admin
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  // First ensure user is logged in
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  // Then ensure user has admin role
  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    return;
  }

  next(); // User is an admin, proceed!
}
