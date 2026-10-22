/**
 * ============================================================================
 * MOVIE CONTROLLER (backend/src/controllers/movieController.ts)
 * ============================================================================
 *
 * Implements:
 * - Flow 2: Browse movies and shows (public endpoint)
 * - Flow 7: Admin add, edit, and delete movie (admin endpoints)
 */

import { Request, Response } from 'express';
import { db } from '../db/database.js';

interface MovieRow {
  id: number;
  title: string;
  description: string;
  poster_url: string;
  language: string;
  duration_mins: number;
  rating: 'U' | 'UA' | 'A';
  created_at: string;
}

/**
 * GET /api/movies
 * Public endpoint: Returns all movies with their upcoming show counts
 */
export function getAllMovies(req: Request, res: Response): void {
  try {
    const movies = db.prepare(`
      SELECT id, title, description, poster_url, language, duration_mins, rating, created_at
      FROM movies
      ORDER BY id DESC
    `).all() as MovieRow[];

    res.json({ movies });
  } catch (err) {
    console.error('Error fetching movies:', err);
    res.status(500).json({ error: 'Failed to fetch movies.' });
  }
}

/**
 * GET /api/movies/:id
 * Public endpoint: Returns details of a single movie + its upcoming shows grouped by date
 *
 * Flow 2 Acceptance Criteria:
 * - Shows that have already started are NOT listed.
 * - Each show displays how many seats are still available out of 80.
 */
export function getMovieById(req: Request, res: Response): void {
  try {
    const movieId = Number(req.params.id);
    if (isNaN(movieId)) {
      res.status(400).json({ error: 'Invalid movie ID.' });
      return;
    }

    const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(movieId) as MovieRow | undefined;
    if (!movie) {
      res.status(404).json({ error: 'Movie not found.' });
      return;
    }

    // Current date and time in local format 'YYYY-MM-DD' and 'HH:MM'
    const now = new Date();
    const currentDateStr = now.toISOString().split('T')[0];
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMins = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMins}`;
    const nowMillis = now.getTime();

    // First, auto-expire any holds older than 5 minutes across the database
    db.prepare(`
      UPDATE show_seats
      SET status = 'available', held_by_user_id = NULL, held_until = NULL
      WHERE status = 'held' AND held_until <= ?
    `).run(nowMillis);

    // Fetch shows for this movie that have NOT started yet
    // Condition: show_date > today OR (show_date == today AND start_time > current_time)
    const shows = db.prepare(`
      SELECT 
        s.id, 
        s.movie_id, 
        s.show_date, 
        s.start_time, 
        s.ticket_price,
        (
          SELECT COUNT(*) 
          FROM show_seats ss 
          WHERE ss.show_id = s.id AND ss.status = 'available'
        ) AS available_seats,
        (
          SELECT COUNT(*) 
          FROM show_seats ss 
          WHERE ss.show_id = s.id
        ) AS total_seats
      FROM shows s
      WHERE s.movie_id = ?
        AND (
          s.show_date > ? 
          OR (s.show_date = ? AND s.start_time > ?)
        )
      ORDER BY s.show_date ASC, s.start_time ASC
    `).all(movieId, currentDateStr, currentDateStr, currentTimeStr) as Array<{
      id: number;
      movie_id: number;
      show_date: string;
      start_time: string;
      ticket_price: number;
      available_seats: number;
      total_seats: number;
    }>;

    // Group upcoming shows by date for clean display in UI:
    // { "2026-10-23": [show1, show2], "2026-10-24": [show3] }
    const showsByDate: Record<string, typeof shows> = {};
    for (const show of shows) {
      if (!showsByDate[show.show_date]) {
        showsByDate[show.show_date] = [];
      }
      showsByDate[show.show_date].push(show);
    }

    res.json({
      movie,
      shows,
      showsByDate
    });
  } catch (err) {
    console.error('Error fetching movie details:', err);
    res.status(500).json({ error: 'Failed to fetch movie details.' });
  }
}

/**
 * POST /api/movies (Admin only)
 * Creates a new movie
 */
export function createMovie(req: Request, res: Response): void {
  try {
    const { title, description, poster_url, language, duration_mins, rating } = req.body;

    if (!title || !language || !duration_mins || !rating) {
      res.status(400).json({ error: 'Title, language, duration in minutes, and rating are required.' });
      return;
    }

    const validRatings = ['U', 'UA', 'A'];
    if (!validRatings.includes(rating.toUpperCase())) {
      res.status(400).json({ error: 'Rating must be one of: U, UA, or A.' });
      return;
    }

    const duration = Number(duration_mins);
    if (isNaN(duration) || duration <= 0) {
      res.status(400).json({ error: 'Duration must be a positive number of minutes.' });
      return;
    }

    const defaultPoster = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80';

    const insertStmt = db.prepare(`
      INSERT INTO movies (title, description, poster_url, language, duration_mins, rating)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      title.trim(),
      description ? description.trim() : '',
      poster_url ? poster_url.trim() : defaultPoster,
      language.trim(),
      duration,
      rating.toUpperCase()
    );

    const newMovie = db.prepare('SELECT * FROM movies WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Movie added successfully!',
      movie: newMovie
    });
  } catch (err) {
    console.error('Error creating movie:', err);
    res.status(500).json({ error: 'Failed to create movie.' });
  }
}

/**
 * PUT /api/movies/:id (Admin only)
 * Updates an existing movie
 */
export function updateMovie(req: Request, res: Response): void {
  try {
    const movieId = Number(req.params.id);
    const { title, description, poster_url, language, duration_mins, rating } = req.body;

    const existing = db.prepare('SELECT * FROM movies WHERE id = ?').get(movieId);
    if (!existing) {
      res.status(404).json({ error: 'Movie not found.' });
      return;
    }

    if (!title || !language || !duration_mins || !rating) {
      res.status(400).json({ error: 'Title, language, duration, and rating are required.' });
      return;
    }

    const validRatings = ['U', 'UA', 'A'];
    if (!validRatings.includes(rating.toUpperCase())) {
      res.status(400).json({ error: 'Rating must be U, UA, or A.' });
      return;
    }

    const duration = Number(duration_mins);
    if (isNaN(duration) || duration <= 0) {
      res.status(400).json({ error: 'Duration must be a positive number.' });
      return;
    }

    db.prepare(`
      UPDATE movies
      SET title = ?, description = ?, poster_url = ?, language = ?, duration_mins = ?, rating = ?
      WHERE id = ?
    `).run(
      title.trim(),
      description ? description.trim() : '',
      poster_url ? poster_url.trim() : '',
      language.trim(),
      duration,
      rating.toUpperCase(),
      movieId
    );

    const updatedMovie = db.prepare('SELECT * FROM movies WHERE id = ?').get(movieId);

    res.json({
      message: 'Movie updated successfully!',
      movie: updatedMovie
    });
  } catch (err) {
    console.error('Error updating movie:', err);
    res.status(500).json({ error: 'Failed to update movie.' });
  }
}

/**
 * DELETE /api/movies/:id (Admin only)
 * Deletes a movie. If it has active bookings, deletion is prevented.
 */
export function deleteMovie(req: Request, res: Response): void {
  try {
    const movieId = Number(req.params.id);

    // Check if any shows for this movie have active confirmed bookings
    const bookingsCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM bookings b
      JOIN shows s ON b.show_id = s.id
      WHERE s.movie_id = ? AND b.status = 'confirmed'
    `).get(movieId) as { count: number };

    if (bookingsCount && bookingsCount.count > 0) {
      res.status(400).json({
        error: 'Cannot delete movie because one or more of its shows have confirmed bookings.'
      });
      return;
    }

    const deleteStmt = db.prepare('DELETE FROM movies WHERE id = ?');
    const result = deleteStmt.run(movieId);

    if (result.changes === 0) {
      res.status(404).json({ error: 'Movie not found.' });
      return;
    }

    res.json({ message: 'Movie deleted successfully.' });
  } catch (err) {
    console.error('Error deleting movie:', err);
    res.status(500).json({ error: 'Failed to delete movie.' });
  }
}
