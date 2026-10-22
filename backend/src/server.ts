/**
 * ============================================================================
 * SERVER ENTRY POINT (backend/src/server.ts)
 * ============================================================================
 *
 * Starts the HTTP server, attaches Socket.IO for real-time seat synchronization,
 * and runs a background interval that cleans up expired seat holds every 30 seconds.
 */

import http from 'http';
import { app } from './app.js';
import { initSocketIO } from './socket.js';
import { db } from './db/database.js';

const PORT = process.env.PORT || 5000;

// Create HTTP server wrapping Express
const server = http.createServer(app);

// Initialize Socket.IO on top of the HTTP server
initSocketIO(server);

// Periodic cleaner: automatically release expired seat holds every 30 seconds
setInterval(() => {
  try {
    const now = Date.now();
    const result = db.prepare(`
      UPDATE show_seats
      SET status = 'available', held_by_user_id = NULL, held_until = NULL
      WHERE status = 'held' AND held_until <= ?
    `).run(now);

    if (result.changes > 0) {
      // console.log(`Cleaned up ${result.changes} expired seat hold(s).`);
    }
  } catch (err) {
    console.error('Error in background hold cleaner:', err);
  }
}, 30000);

server.listen(PORT, () => {
  console.log(`🎬 Yozigo Cinema Backend Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server initialized for real-time seat synchronization.`);
});
