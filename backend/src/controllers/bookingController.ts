/**
 * ============================================================================
 * BOOKING CONTROLLER (backend/src/controllers/bookingController.ts)
 * ============================================================================
 *
 * Implements:
 * - Flow 4: Select and hold seats (1 to 6 seats, 5-minute temporary reservation)
 * - Flow 5: Pay and confirm booking (Atomic database transaction preventing double booking)
 * - Flow 6: My bookings (Isolated per user, upcoming first, then past)
 * - Flow 8: Cancel a booking (Allowed up to 2 hours before show start)
 *
 * FOR VIBE CODERS - HOW TRANSACTIONS PREVENT DOUBLE BOOKING:
 * ----------------------------------------------------------------------------
 * Imagine two people, User A and User B, both click "Book C4" at the exact same millisecond.
 * Without database transactions, both requests might check "is C4 free?", see "yes",
 * and both write "booked by me" - resulting in the infamous double-booking disaster!
 *
 * How we solve this here:
 * We wrap the seat check and update in `db.transaction()`.
 * SQLite locks the database during write transactions (ACID properties).
 * - User A's transaction executes first: checks seat -> available -> marks as held/booked -> commits.
 * - User B's transaction immediately runs next: checks seat -> finds it is already taken!
 * - User B's transaction throws an error and rolls back, returning a 409 Conflict.
 * In this way, NO SEAT CAN EVER BE BOOKED TWICE.
 */

import { Request, Response } from 'express';
import { db } from '../db/database.js';
import { broadcastSeatUpdate } from '../socket.js';

const HOLD_DURATION_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * POST /api/bookings/hold
 * Flow 4: Hold 1 to 6 seats for 5 minutes while user proceeds to payment.
 */
export function holdSeats(req: Request, res: Response): void {
  try {
    const userId = req.user!.id;
    const { showId, seats } = req.body;

    // 1. Validation: 1 to 6 seats only
    if (!showId || !Array.isArray(seats) || seats.length === 0) {
      res.status(400).json({ error: 'Please select at least 1 seat.' });
      return;
    }

    if (seats.length > 6) {
      res.status(400).json({ error: 'You can only select up to 6 seats per booking.' });
      return;
    }

    const now = Date.now();
    const expiresAt = now + HOLD_DURATION_MS;

    // 2. Execute within an ACID transaction
    const holdTx = db.transaction(() => {
      // Step A: Expire all globally timed-out holds for this show
      db.prepare(`
        UPDATE show_seats
        SET status = 'available', held_by_user_id = NULL, held_until = NULL
        WHERE show_id = ? AND status = 'held' AND held_until <= ?
      `).run(showId, now);

      // Step B: Release any previous uncompleted holds by this same user for this show
      // (ensures user cannot hoard more than 6 seats across multiple tabs)
      db.prepare(`
        UPDATE show_seats
        SET status = 'available', held_by_user_id = NULL, held_until = NULL
        WHERE show_id = ? AND held_by_user_id = ? AND status = 'held'
      `).run(showId, userId);

      // Step C: Check each requested seat to verify it is truly available
      for (const seatNumber of seats) {
        const seat = db.prepare(`
          SELECT status, held_by_user_id, held_until
          FROM show_seats
          WHERE show_id = ? AND seat_number = ?
        `).get(showId, seatNumber) as {
          status: string;
          held_by_user_id: number | null;
          held_until: number | null;
        } | undefined;

        if (!seat) {
          throw new Error(`Seat ${seatNumber} does not exist in this cinema.`);
        }

        // Check if taken by someone else
        const isHeldByOther = seat.status === 'held' && seat.held_until && seat.held_until > now && seat.held_by_user_id !== userId;
        const isBooked = seat.status === 'booked';

        if (isBooked || isHeldByOther) {
          // Flow 4 Acceptance: "If any chosen seat was taken by someone else in the meantime, the hold fails, the user is told which seat, and the map refreshes."
          throw new Error(`SEAT_TAKEN:${seatNumber}`);
        }
      }

      // Step D: All requested seats are free! Place the 5-minute hold on all of them
      const holdSeatStmt = db.prepare(`
        UPDATE show_seats
        SET status = 'held', held_by_user_id = ?, held_until = ?
        WHERE show_id = ? AND seat_number = ?
      `);

      for (const seatNumber of seats) {
        holdSeatStmt.run(userId, expiresAt, showId, seatNumber);
      }
    });

    try {
      holdTx();
    } catch (txErr: any) {
      if (txErr.message.startsWith('SEAT_TAKEN:')) {
        const takenSeat = txErr.message.replace('SEAT_TAKEN:', '');
        // Notify others of any seat status changes
        broadcastSeatUpdate(showId);
        res.status(409).json({
          error: `Seat ${takenSeat} was just taken by another customer. Please choose different seats.`,
          seat: takenSeat
        });
        return;
      }
      res.status(400).json({ error: txErr.message });
      return;
    }

    // Step E: Broadcast real-time update to all viewers of this show
    broadcastSeatUpdate(showId);

    res.json({
      message: 'Seats held successfully for 5 minutes!',
      seats,
      expiresAt,
      holdDurationSeconds: 300
    });
  } catch (err: any) {
    console.error('Error holding seats:', err);
    res.status(500).json({ error: 'Failed to hold seats.' });
  }
}

/**
 * POST /api/bookings/confirm
 * Flow 5: Payment success confirmation
 * Confirms booking, changes seats from 'held' to 'booked', and creates booking receipt.
 */
export function confirmBooking(req: Request, res: Response): void {
  try {
    const userId = req.user!.id;
    const { showId, seats } = req.body;

    if (!showId || !Array.isArray(seats) || seats.length === 0) {
      res.status(400).json({ error: 'Invalid booking confirmation request.' });
      return;
    }

    const now = Date.now();

    // Fetch show and movie info for price and confirmation details
    const show = db.prepare(`
      SELECT s.*, m.title as movie_title, m.poster_url, m.duration_mins
      FROM shows s
      JOIN movies m ON s.movie_id = m.id
      WHERE s.id = ?
    `).get(showId) as {
      id: number;
      ticket_price: number;
      movie_title: string;
      show_date: string;
      start_time: string;
      poster_url: string;
    } | undefined;

    if (!show) {
      res.status(404).json({ error: 'Show not found.' });
      return;
    }

    const totalAmount = show.ticket_price * seats.length;
    let createdBookingId = 0;

    // Execute atomic booking confirmation in a SQL transaction
    const confirmTx = db.transaction(() => {
      // 1. Verify that EVERY requested seat is currently held by THIS user and hold hasn't expired
      for (const seatNumber of seats) {
        const seat = db.prepare(`
          SELECT status, held_by_user_id, held_until
          FROM show_seats
          WHERE show_id = ? AND seat_number = ?
        `).get(showId, seatNumber) as {
          status: string;
          held_by_user_id: number | null;
          held_until: number | null;
        } | undefined;

        if (!seat) {
          throw new Error(`Seat ${seatNumber} not found.`);
        }

        const isHeldByThisUser = seat.status === 'held' && seat.held_by_user_id === userId;
        const isNotExpired = seat.held_until && seat.held_until > now;

        if (!isHeldByThisUser || !isNotExpired) {
          // Flow 5 Acceptance: "Paying after the hold expired is rejected with a clear message."
          throw new Error(`EXPIRED:Seat ${seatNumber} hold has expired. Please re-select your seats.`);
        }
      }

      // 2. Create the booking entry in the bookings table
      const insertBookingStmt = db.prepare(`
        INSERT INTO bookings (user_id, show_id, total_amount, status)
        VALUES (?, ?, ?, 'confirmed')
      `);
      const bookingResult = insertBookingStmt.run(userId, showId, totalAmount);
      createdBookingId = Number(bookingResult.lastInsertRowid);

      // 3. Mark the seats as permanently 'booked' and attach the booking_id
      const bookSeatStmt = db.prepare(`
        UPDATE show_seats
        SET status = 'booked', held_by_user_id = NULL, held_until = NULL, booking_id = ?
        WHERE show_id = ? AND seat_number = ?
      `);

      for (const seatNumber of seats) {
        bookSeatStmt.run(createdBookingId, showId, seatNumber);
      }
    });

    try {
      confirmTx();
    } catch (txErr: any) {
      if (txErr.message.startsWith('EXPIRED:')) {
        broadcastSeatUpdate(showId);
        res.status(400).json({ error: txErr.message.replace('EXPIRED:', '') });
        return;
      }
      res.status(400).json({ error: txErr.message });
      return;
    }

    // Step 4: Broadcast the confirmed seats update to all live viewers!
    broadcastSeatUpdate(showId);

    // Return the full booking confirmation receipt
    res.status(201).json({
      message: 'Booking confirmed successfully!',
      booking: {
        id: createdBookingId,
        movieTitle: show.movie_title,
        showDate: show.show_date,
        startTime: show.start_time,
        seats,
        totalAmount,
        posterUrl: show.poster_url,
        status: 'confirmed'
      }
    });
  } catch (err: any) {
    console.error('Error confirming booking:', err);
    res.status(500).json({ error: 'Failed to confirm booking.' });
  }
}

/**
 * GET /api/bookings/my-bookings
 * Flow 6: Lists user's bookings, upcoming first, then past ones.
 *
 * Strict isolation: Queries solely by `req.user.id`.
 * Even if a user attempts to alter query params, they can NEVER see another user's bookings.
 */
export function getMyBookings(req: Request, res: Response): void {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const currentDateStr = now.toISOString().split('T')[0];
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMins = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMins}`;

    // Query all bookings belonging strictly to this user
    const rows = db.prepare(`
      SELECT 
        b.id as booking_id,
        b.total_amount,
        b.status,
        b.created_at,
        s.id as show_id,
        s.show_date,
        s.start_time,
        s.ticket_price,
        m.title as movie_title,
        m.poster_url,
        m.duration_mins,
        m.rating,
        (
          SELECT GROUP_CONCAT(ss.seat_number, ', ')
          FROM show_seats ss
          WHERE ss.booking_id = b.id
        ) as seats_list
      FROM bookings b
      JOIN shows s ON b.show_id = s.id
      JOIN movies m ON s.movie_id = m.id
      WHERE b.user_id = ?
      ORDER BY 
        -- Upcoming shows first (ascending by date & time), then past shows
        CASE 
          WHEN s.show_date > ? OR (s.show_date = ? AND s.start_time > ?) THEN 0
          ELSE 1
        END ASC,
        s.show_date DESC,
        s.start_time DESC
    `).all(userId, currentDateStr, currentDateStr, currentTimeStr) as Array<{
      booking_id: number;
      total_amount: number;
      status: 'confirmed' | 'cancelled';
      created_at: string;
      show_id: number;
      show_date: string;
      start_time: string;
      ticket_price: number;
      movie_title: string;
      poster_url: string;
      duration_mins: number;
      rating: string;
      seats_list: string | null;
    }>;

    const bookings = rows.map((r) => {
      // Determine if show is upcoming or past
      const showDateTime = new Date(`${r.show_date}T${r.start_time}:00`);
      const isUpcoming = showDateTime.getTime() > now.getTime();

      // Check if eligible for cancellation (allowed up to 2 hours before show start)
      const hoursUntilShow = (showDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      const canCancel = r.status === 'confirmed' && isUpcoming && hoursUntilShow >= 2;

      return {
        id: r.booking_id,
        movieTitle: r.movie_title,
        posterUrl: r.poster_url,
        showDate: r.show_date,
        startTime: r.start_time,
        ticketPrice: r.ticket_price,
        seats: r.seats_list ? r.seats_list.split(', ') : [],
        totalAmount: r.total_amount,
        status: r.status,
        bookedAt: r.created_at,
        isUpcoming,
        canCancel,
        hoursUntilShow: Math.max(0, hoursUntilShow)
      };
    });

    res.json({ bookings });
  } catch (err) {
    console.error('Error fetching user bookings:', err);
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
}

/**
 * POST /api/bookings/:id/cancel
 * Bonus Flow 8: Cancel a booking
 *
 * Acceptance Criteria:
 * - Customer can cancel their own upcoming booking up to 2 hours before the show starts.
 * - Cancelling within 2 hours of the show, or for a past show, is rejected with a clear message.
 * - Cancelled seats become available again right away, and booking status shows "Cancelled".
 */
export function cancelBooking(req: Request, res: Response): void {
  try {
    const userId = req.user!.id;
    const bookingId = Number(req.params.id);

    if (isNaN(bookingId)) {
      res.status(400).json({ error: 'Invalid booking ID.' });
      return;
    }

    // Fetch the booking and verify ownership (user cannot cancel someone else's booking)
    const booking = db.prepare(`
      SELECT b.*, s.show_date, s.start_time
      FROM bookings b
      JOIN shows s ON b.show_id = s.id
      WHERE b.id = ? AND b.user_id = ?
    `).get(bookingId, userId) as {
      id: number;
      user_id: number;
      show_id: number;
      status: string;
      show_date: string;
      start_time: string;
    } | undefined;

    if (!booking) {
      res.status(404).json({ error: 'Booking not found or does not belong to you.' });
      return;
    }

    if (booking.status === 'cancelled') {
      res.status(400).json({ error: 'This booking is already cancelled.' });
      return;
    }

    // Check time constraint: up to 2 hours before the show starts
    const now = Date.now();
    const showTimeMillis = new Date(`${booking.show_date}T${booking.start_time}:00`).getTime();
    const twoHoursInMs = 2 * 60 * 60 * 1000;

    if (showTimeMillis <= now) {
      res.status(400).json({ error: 'Cannot cancel a booking for a show that has already started or completed.' });
      return;
    }

    if (showTimeMillis - now < twoHoursInMs) {
      res.status(400).json({ error: 'Bookings can only be cancelled up to 2 hours before the show starts.' });
      return;
    }

    // Execute cancellation in transaction:
    // 1. Mark booking as cancelled
    // 2. Free up the seats so they become available again right away
    const cancelTx = db.transaction(() => {
      db.prepare(`UPDATE bookings SET status = 'cancelled' WHERE id = ?`).run(bookingId);

      db.prepare(`
        UPDATE show_seats
        SET status = 'available', held_by_user_id = NULL, held_until = NULL, booking_id = NULL
        WHERE booking_id = ?
      `).run(bookingId);
    });

    cancelTx();

    // Broadcast seat changes live to all users
    broadcastSeatUpdate(booking.show_id);

    res.json({
      message: 'Booking cancelled successfully. Your seats have been released.',
      bookingId
    });
  } catch (err) {
    console.error('Error cancelling booking:', err);
    res.status(500).json({ error: 'Failed to cancel booking.' });
  }
}
