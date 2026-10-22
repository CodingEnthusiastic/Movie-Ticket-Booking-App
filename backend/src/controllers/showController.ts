/**
 * ============================================================================
 * SHOW CONTROLLER (backend/src/controllers/showController.ts)
 * ============================================================================
 *
 * Implements:
 * - Flow 3: See the seat map (8x10 grid with accurate states)
 * - Flow 7: Admin add show (with rigorous OVERLAP check), and delete show
 * - Flow 9: Admin show statistics and booking inspection
 */

import { Request, Response } from 'express';
import { db } from '../db/database.js';

interface ShowRow {
  id: number;
  movie_id: number;
  movie_title: string;
  movie_duration: number;
  show_date: string;
  start_time: string;
  ticket_price: number;
  rating: string;
  poster_url: string;
}

/**
 * GET /api/shows/:id/seats
 * Fetches the 8x10 seat map for a given show.
 *
 * Flow 3 Acceptance Criteria:
 * - 8 rows (A to H) x 10 seats (1 to 10) = 80 seats.
 * - Each seat indicates status: 'available', 'held', or 'booked'.
 * - If user is logged in, indicates if a held seat is held by THEM or someone else.
 * - Automatically expires holds older than 5 minutes.
 */
export function getShowSeats(req: Request, res: Response): void {
  try {
    const showId = Number(req.params.id);
    if (isNaN(showId)) {
      res.status(400).json({ error: 'Invalid show ID.' });
      return;
    }

    // Fetch show details
    const show = db.prepare(`
      SELECT s.*, m.title as movie_title, m.duration_mins as movie_duration, m.poster_url, m.rating
      FROM shows s
      JOIN movies m ON s.movie_id = m.id
      WHERE s.id = ?
    `).get(showId) as ShowRow | undefined;

    if (!show) {
      res.status(404).json({ error: 'Show not found.' });
      return;
    }

    const now = Date.now();
    const currentUserId = req.user?.id || null;

    // Auto-expire holds where 5 minutes have elapsed
    db.prepare(`
      UPDATE show_seats
      SET status = 'available', held_by_user_id = NULL, held_until = NULL
      WHERE show_id = ? AND status = 'held' AND held_until <= ?
    `).run(showId, now);

    // Fetch all 80 seats for this show
    const rawSeats = db.prepare(`
      SELECT seat_number, status, held_by_user_id, held_until, booking_id
      FROM show_seats
      WHERE show_id = ?
      ORDER BY seat_number ASC
    `).all(showId) as Array<{
      seat_number: string;
      status: 'available' | 'held' | 'booked';
      held_by_user_id: number | null;
      held_until: number | null;
      booking_id: number | null;
    }>;

    // Structure the seats for the frontend
    const seats = rawSeats.map((s) => {
      const isHeldByMe = currentUserId !== null && s.held_by_user_id === currentUserId;
      // If hold has expired, treat it as available
      const isExpired = s.status === 'held' && s.held_until && s.held_until <= now;
      const effectiveStatus = isExpired ? 'available' : s.status;

      return {
        seatNumber: s.seat_number,
        status: effectiveStatus,
        heldByMe: !isExpired && isHeldByMe,
        heldByOther: !isExpired && s.status === 'held' && !isHeldByMe,
        heldUntil: !isExpired ? s.held_until : null
      };
    });

    res.json({
      show: {
        id: show.id,
        movieId: show.movie_id,
        movieTitle: show.movie_title,
        movieDuration: show.movie_duration,
        showDate: show.show_date,
        startTime: show.start_time,
        ticketPrice: show.ticket_price,
        posterUrl: show.poster_url,
        rating: show.rating
      },
      seats
    });
  } catch (err) {
    console.error('Error fetching show seats:', err);
    res.status(500).json({ error: 'Failed to fetch seats.' });
  }
}

/**
 * POST /api/shows (Admin only)
 * Creates a new show with strict OVERLAP checking.
 *
 * Flow 7 Acceptance Criteria:
 * "Two shows on the same screen cannot overlap in time (start time + movie duration).
 *  Trying it shows an error."
 */
export function createShow(req: Request, res: Response): void {
  try {
    const { movie_id, show_date, start_time, ticket_price } = req.body;

    if (!movie_id || !show_date || !start_time || ticket_price === undefined) {
      res.status(400).json({ error: 'Movie, show date, start time, and ticket price are required.' });
      return;
    }

    const price = Number(ticket_price);
    if (isNaN(price) || price < 0) {
      res.status(400).json({ error: 'Ticket price must be a valid non-negative number.' });
      return;
    }

    // 1. Fetch the movie to get its duration
    const movie = db.prepare('SELECT id, title, duration_mins FROM movies WHERE id = ?').get(movie_id) as {
      id: number;
      title: string;
      duration_mins: number;
    } | undefined;

    if (!movie) {
      res.status(404).json({ error: 'Selected movie does not exist.' });
      return;
    }

    // 2. Parse new show's start and end timestamps (in milliseconds)
    // Note: show_date format is 'YYYY-MM-DD', start_time format is 'HH:MM'
    const newStartMillis = new Date(`${show_date}T${start_time}:00`).getTime();
    if (isNaN(newStartMillis)) {
      res.status(400).json({ error: 'Invalid date or time format. Use YYYY-MM-DD and HH:MM.' });
      return;
    }
    const newEndMillis = newStartMillis + movie.duration_mins * 60 * 1000;

    // 3. Check for any overlaps on the single screen.
    // We inspect all shows scheduled around this date
    const existingShows = db.prepare(`
      SELECT s.id, s.show_date, s.start_time, m.title as movie_title, m.duration_mins
      FROM shows s
      JOIN movies m ON s.movie_id = m.id
    `).all() as Array<{
      id: number;
      show_date: string;
      start_time: string;
      movie_title: string;
      duration_mins: number;
    }>;

    for (const ex of existingShows) {
      const exStartMillis = new Date(`${ex.show_date}T${ex.start_time}:00`).getTime();
      const exEndMillis = exStartMillis + ex.duration_mins * 60 * 1000;

      // Two intervals [A, B) and [C, D) overlap if A < D and B > C
      const isOverlapping = newStartMillis < exEndMillis && newEndMillis > exStartMillis;

      if (isOverlapping) {
        // Calculate existing show's end time string for friendly error
        const exEndDate = new Date(exEndMillis);
        const exEndHours = String(exEndDate.getHours()).padStart(2, '0');
        const exEndMins = String(exEndDate.getMinutes()).padStart(2, '0');
        const formattedEndTime = `${exEndHours}:${exEndMins}`;

        res.status(400).json({
          error: `Time conflict! Screen is occupied by "${ex.movie_title}" (${ex.start_time} - ${formattedEndTime}). Two shows on the same screen cannot overlap.`
        });
        return;
      }
    }

    // 4. No overlap! Insert the show into the shows table
    const insertShowStmt = db.prepare(`
      INSERT INTO shows (movie_id, show_date, start_time, ticket_price)
      VALUES (?, ?, ?, ?)
    `);

    const result = insertShowStmt.run(movie_id, show_date, start_time, price);
    const showId = Number(result.lastInsertRowid);

    // 5. Populate all 80 seats (A1 to H10) for this newly created show
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const insertSeatStmt = db.prepare(`
      INSERT INTO show_seats (show_id, seat_number, status)
      VALUES (?, ?, 'available')
    `);

    const populateTx = db.transaction(() => {
      for (const row of rows) {
        for (let num = 1; num <= 10; num++) {
          insertSeatStmt.run(showId, `${row}${num}`);
        }
      }
    });
    populateTx();

    res.status(201).json({
      message: 'Show created successfully with 80 seats initialized.',
      showId
    });
  } catch (err) {
    console.error('Error creating show:', err);
    res.status(500).json({ error: 'Failed to create show.' });
  }
}

/**
 * DELETE /api/shows/:id (Admin only)
 *
 * Flow 7 Acceptance Criteria:
 * "A show that already has bookings cannot be deleted."
 */
export function deleteShow(req: Request, res: Response): void {
  try {
    const showId = Number(req.params.id);

    // Check if any bookings exist for this show
    const activeBookings = db.prepare(`
      SELECT COUNT(*) as count 
      FROM bookings 
      WHERE show_id = ? AND status = 'confirmed'
    `).get(showId) as { count: number };

    if (activeBookings && activeBookings.count > 0) {
      res.status(400).json({
        error: 'Cannot delete this show because it already has confirmed customer bookings.'
      });
      return;
    }

    const result = db.prepare('DELETE FROM shows WHERE id = ?').run(showId);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Show not found.' });
      return;
    }

    res.json({ message: 'Show deleted successfully.' });
  } catch (err) {
    console.error('Error deleting show:', err);
    res.status(500).json({ error: 'Failed to delete show.' });
  }
}

/**
 * GET /api/shows/admin/stats (Admin only)
 *
 * Bonus Flow 9 Acceptance Criteria:
 * - For each show, admin sees seats booked out of 80, the percentage full, and total money collected.
 */
export function getAdminShowStats(req: Request, res: Response): void {
  try {
    const shows = db.prepare(`
      SELECT 
        s.id,
        s.show_date,
        s.start_time,
        s.ticket_price,
        m.title as movie_title,
        m.duration_mins,
        (
          SELECT COUNT(*)
          FROM show_seats ss
          WHERE ss.show_id = s.id AND ss.status = 'booked'
        ) as booked_seats,
        (
          SELECT COALESCE(SUM(b.total_amount), 0)
          FROM bookings b
          WHERE b.show_id = s.id AND b.status = 'confirmed'
        ) as total_revenue
      FROM shows s
      JOIN movies m ON s.movie_id = m.id
      ORDER BY s.show_date DESC, s.start_time DESC
    `).all() as Array<{
      id: number;
      show_date: string;
      start_time: string;
      ticket_price: number;
      movie_title: string;
      duration_mins: number;
      booked_seats: number;
      total_revenue: number;
    }>;

    const stats = shows.map((s) => ({
      ...s,
      totalSeats: 80,
      percentageFull: Math.round((s.booked_seats / 80) * 100)
    }));

    res.json({ shows: stats });
  } catch (err) {
    console.error('Error fetching admin show stats:', err);
    res.status(500).json({ error: 'Failed to fetch show statistics.' });
  }
}

/**
 * GET /api/shows/:id/admin-details (Admin only)
 *
 * Bonus Flow 9 Acceptance Criteria:
 * - Admin can open a show and see the list of bookings (booking ID, customer name, seats, time booked).
 * - Admin sees the same seat map as customers with booked seats marked and customer info.
 */
export function getShowAdminDetails(req: Request, res: Response): void {
  try {
    const showId = Number(req.params.id);

    const show = db.prepare(`
      SELECT s.*, m.title as movie_title, m.duration_mins
      FROM shows s
      JOIN movies m ON s.movie_id = m.id
      WHERE s.id = ?
    `).get(showId);

    if (!show) {
      res.status(404).json({ error: 'Show not found.' });
      return;
    }

    // List of bookings for this show
    const bookings = db.prepare(`
      SELECT 
        b.id as booking_id,
        u.name as customer_name,
        u.email as customer_email,
        b.total_amount,
        b.status,
        b.created_at as booked_at,
        (
          SELECT GROUP_CONCAT(ss.seat_number, ', ')
          FROM show_seats ss
          WHERE ss.booking_id = b.id
        ) as seats
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.show_id = ?
      ORDER BY b.created_at DESC
    `).all(showId);

    // Seat map with booking association
    const seats = db.prepare(`
      SELECT 
        ss.seat_number,
        ss.status,
        ss.booking_id,
        u.name as booked_by_name,
        u.email as booked_by_email
      FROM show_seats ss
      LEFT JOIN bookings b ON ss.booking_id = b.id
      LEFT JOIN users u ON b.user_id = u.id
      WHERE ss.show_id = ?
      ORDER BY ss.seat_number ASC
    `).all(showId);

    res.json({
      show,
      bookings,
      seats
    });
  } catch (err) {
    console.error('Error fetching show admin details:', err);
    res.status(500).json({ error: 'Failed to fetch show admin details.' });
  }
}
