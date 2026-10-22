/**
 * ============================================================================
 * REAL-TIME WEBSOCKET MANAGEMENT (backend/src/socket.ts)
 * ============================================================================
 *
 * Flow 10 Requirement: Live seat updates
 * "When another user holds or books a seat, it changes state on my open seat map
 *  within a few seconds, without a page reload."
 *
 * Why WebSockets (Socket.IO)?
 * 1. WebSockets provide a persistent, bi-directional, low-latency connection.
 * 2. Room support: We group users by `show-${showId}`. Users looking at Movie A
 *    only receive updates for Movie A, keeping network traffic minimal and fast.
 * 3. Instant updates: As soon as someone holds, books, or cancels seats, the
 *    change is pushed to all connected browsers in less than 50 milliseconds!
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { db } from './db/database.js';

let io: SocketIOServer | null = null;

export function initSocketIO(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*', // In development, allow frontend connections from any port
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    // When a frontend client enters the seat map for a specific show:
    socket.on('join_show', (showId: number) => {
      const room = `show-${showId}`;
      socket.join(room);
      // console.log(`User ${socket.id} joined room ${room}`);
    });

    // When client leaves the seat map:
    socket.on('leave_show', (showId: number) => {
      const room = `show-${showId}`;
      socket.leave(room);
    });

    socket.on('disconnect', () => {
      // console.log(`User ${socket.id} disconnected`);
    });
  });

  return io;
}

/**
 * Broadcasts the updated seats of a show to all clients currently viewing that show.
 */
export function broadcastSeatUpdate(showId: number) {
  if (!io) return;

  try {
    const now = Date.now();

    // Fetch the updated seats for this show
    const seats = db.prepare(`
      SELECT seat_number, status, held_by_user_id, held_until
      FROM show_seats
      WHERE show_id = ?
      ORDER BY seat_number ASC
    `).all(showId) as Array<{
      seat_number: string;
      status: 'available' | 'held' | 'booked';
      held_by_user_id: number | null;
      held_until: number | null;
    }>;

    // Normalize any expired holds on the fly
    const formattedSeats = seats.map((s) => {
      const isHoldExpired = s.status === 'held' && s.held_until && s.held_until <= now;
      const effectiveStatus = isHoldExpired ? 'available' : s.status;

      return {
        seatNumber: s.seat_number,
        status: effectiveStatus,
        heldByUserId: isHoldExpired ? null : s.held_by_user_id,
        heldUntil: isHoldExpired ? null : s.held_until
      };
    });

    // Send the latest seat state to all active clients in this show's room
    io.to(`show-${showId}`).emit('seats_updated', {
      showId,
      seats: formattedSeats,
      timestamp: now
    });
  } catch (err) {
    console.error('Error broadcasting seat update:', err);
  }
}
