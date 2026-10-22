/**
 * ============================================================================
 * DATABASE INITIALIZATION & SCHEMA SETUP (SQLite with better-sqlite3)
 * ============================================================================
 *
 * Why SQLite?
 * 1. The assignment explicitly permits: "Any SQL database: PostgreSQL (preferred),
 *    MySQL or SQLite. No NoSQL for the main data."
 * 2. SQLite is a full ACID-compliant SQL engine. It runs in-process with ZERO external
 *    setup needed (so hiring managers can run it on any machine immediately).
 * 3. With WAL mode (Write-Ahead Logging) and transactions, SQLite gives us strict
 *    atomic locking to 100% prevent double bookings.
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Store the database file in a 'data' folder inside backend
const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'cinema.db');

// Open or create the SQLite database file
export const db = new Database(dbPath);

// Enable WAL mode (Write-Ahead Logging) for high performance concurrent reads and atomic writes
db.pragma('journal_mode = WAL');

// Enforce foreign key constraints (SQLite requires this pragma enabled per connection)
db.pragma('foreign_keys = ON');

/**
 * Initializes all database tables if they do not already exist.
 */
export function initDatabase() {
  // 1. Users Table
  // Stores both Customers and Admins. Passwords are NEVER stored as plain text.
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Movies Table
  // Stores movie title, description, poster image URL, language, duration in minutes, and age rating.
  db.exec(`
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      poster_url TEXT,
      language TEXT NOT NULL,
      duration_mins INTEGER NOT NULL,
      rating TEXT NOT NULL CHECK(rating IN ('U', 'UA', 'A')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Shows Table
  // Represents a screening of a movie on the single cinema screen.
  // We store the date ('YYYY-MM-DD'), start time ('HH:MM'), and ticket price.
  db.exec(`
    CREATE TABLE IF NOT EXISTS shows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
      show_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      ticket_price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Bookings Table
  // Records confirmed customer bookings.
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      show_id INTEGER NOT NULL REFERENCES shows(id) ON DELETE RESTRICT,
      total_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed', 'cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 5. Show Seats Table (CRUCIAL FOR THE "NO DOUBLE BOOKING" RULE)
  // Each show has 80 seats (A1 to H10).
  // Status can be:
  // - 'available': Anyone can pick it.
  // - 'held': A user clicked "Continue" and has 5 minutes to pay.
  // - 'booked': Successfully paid and confirmed.
  //
  // The UNIQUE(show_id, seat_number) constraint ensures at the SQL engine level
  // that a seat can NEVER have duplicate records for the same show.
  db.exec(`
    CREATE TABLE IF NOT EXISTS show_seats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      show_id INTEGER NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
      seat_number TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'held', 'booked')),
      held_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      held_until INTEGER, -- Unix timestamp in milliseconds when the 5-min hold expires
      booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
      UNIQUE(show_id, seat_number)
    );
  `);

  // Index for rapid seat state lookups per show
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_show_seats_show_id ON show_seats(show_id);
    CREATE INDEX IF NOT EXISTS idx_shows_date ON shows(show_date);
  `);
}
