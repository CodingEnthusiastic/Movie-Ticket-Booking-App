/**
 * ============================================================================
 * AUTH CONTROLLER (backend/src/controllers/authController.ts)
 * ============================================================================
 *
 * Implements Flow 1: Sign up and log in
 * Acceptance criteria:
 * 1. A new user can sign up with name, email and password.
 * 2. Signing up with an email that already exists shows a clear error.
 * 3. Password must be at least 8 characters; it is stored hashed, never as plain text.
 * 4. A user can log in and log out. Wrong email or password shows an error without
 *    saying which one was wrong ("Invalid email or password").
 * 5. Pages and APIs are protected: backend rejects unauthorized calls with 401.
 * 6. Normal sign-up NEVER creates an admin (role is hardcoded to 'customer').
 */

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';
import { JWT_SECRET, AuthUserPayload } from '../middleware/auth.js';

interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: 'customer' | 'admin';
  created_at: string;
}

/**
 * Helper to generate a signed JWT token
 */
function generateToken(payload: AuthUserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * POST /api/auth/signup
 */
export function signup(req: Request, res: Response): void {
  try {
    const { name, email, password } = req.body;

    // 1. Validation: Name, Email and Password must be provided
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'Name is required.' });
      return;
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ error: 'A valid email address is required.' });
      return;
    }

    // 2. Validation: Password must be at least 8 characters
    if (!password || typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 3. Check if email already exists in the database
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
      return;
    }

    // 4. Hash password with bcrypt (10 rounds of salt) - NEVER plain text!
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // 5. Insert user with role 'customer' (Normal sign-up NEVER creates an admin!)
    const insertStmt = db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, 'customer')
    `);

    const result = insertStmt.run(name.trim(), normalizedEmail, passwordHash);
    const userId = Number(result.lastInsertRowid);

    const userPayload: AuthUserPayload = {
      id: userId,
      email: normalizedEmail,
      name: name.trim(),
      role: 'customer'
    };

    const token = generateToken(userPayload);

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: userPayload
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'An unexpected error occurred during signup.' });
  }
}

/**
 * POST /api/auth/login
 */
export function login(req: Request, res: Response): void {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Please enter both email and password.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Look up user by email
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail) as UserRow | undefined;

    // Security requirement: "Wrong email or password shows an error without saying which one was wrong."
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // Compare provided plain password against the stored bcrypt hash
    const isPasswordCorrect = bcrypt.compareSync(password, user.password_hash);
    if (!isPasswordCorrect) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const userPayload: AuthUserPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    const token = generateToken(userPayload);

    res.status(200).json({
      message: 'Logged in successfully!',
      token,
      user: userPayload
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'An unexpected error occurred during login.' });
  }
}

/**
 * GET /api/auth/me
 * Returns current authenticated user info
 */
export function getMe(req: Request, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }

  const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  res.json({ user });
}
