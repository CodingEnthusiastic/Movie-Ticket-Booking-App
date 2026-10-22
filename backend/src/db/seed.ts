/**
 * ============================================================================
 * SEED SCRIPT (backend/src/db/seed.ts)
 * ============================================================================
 *
 * This script populates the database with:
 * 1. Admin account:
 *    - Email: admin@cinema.com
 *    - Password: admin123456
 * 2. Test Customer account:
 *    - Email: customer@cinema.com
 *    - Password: password123
 * 3. Popular Movies with poster URLs, ratings, languages, and durations.
 * 4. Upcoming Shows scheduled for today and tomorrow with no overlaps.
 * 5. 80 pre-generated seats (A1 through H10) for every created show.
 *
 * Run with: npm run seed
 */

import bcrypt from 'bcryptjs';
import { db, initDatabase } from './database.js';

export function seedData() {
  console.log('🌱 Starting database seeding...');

  // Initialize all tables first
  initDatabase();

  // Clear existing data for a fresh clean slate
  db.exec(`
    DELETE FROM show_seats;
    DELETE FROM bookings;
    DELETE FROM shows;
    DELETE FROM movies;
    DELETE FROM users;
  `);

  // --- 1. SEED USERS ---
  const salt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync('admin123456', salt);
  const customerPasswordHash = bcrypt.hashSync('password123', salt);

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `);

  const adminResult = insertUser.run('Cinema Staff Admin', 'admin@cinema.com', adminPasswordHash, 'admin');
  const customerResult = insertUser.run('Test Customer', 'customer@cinema.com', customerPasswordHash, 'customer');

  console.log(`✅ Seeded Admin (ID: ${adminResult.lastInsertRowid}) & Customer (ID: ${customerResult.lastInsertRowid})`);

  // --- 2. SEED MOVIES ---
  const insertMovie = db.prepare(`
    INSERT INTO movies (title, description, poster_url, language, duration_mins, rating)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const moviesData = [
    {
      title: 'Interstellar',
      description: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
      poster_url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80',
      language: 'English',
      duration_mins: 169,
      rating: 'UA'
    },
    {
      title: 'Inception',
      description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
      poster_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
      language: 'English',
      duration_mins: 148,
      rating: 'UA'
    },
    {
      title: 'Dune: Part Two',
      description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
      poster_url: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=600&auto=format&fit=crop&q=80',
      language: 'English',
      duration_mins: 166,
      rating: 'UA'
    },
    {
      title: 'Spirited Away',
      description: 'During her family\'s move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits, and where humans are changed into beasts.',
      poster_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      language: 'Japanese',
      duration_mins: 125,
      rating: 'U'
    }
  ];

  const movieIds: number[] = [];
  for (const m of moviesData) {
    const res = insertMovie.run(m.title, m.description, m.poster_url, m.language, m.duration_mins, m.rating);
    movieIds.push(Number(res.lastInsertRowid));
  }
  console.log(`✅ Seeded ${movieIds.length} Movies.`);

  // --- 3. SEED SHOWS & SEATS ---
  // We will schedule shows for Today and Tomorrow with non-overlapping times.
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const todayStr = formatDate(today);
  const tomorrowStr = formatDate(tomorrow);

  const insertShow = db.prepare(`
    INSERT INTO shows (movie_id, show_date, start_time, ticket_price)
    VALUES (?, ?, ?, ?)
  `);

  const insertSeat = db.prepare(`
    INSERT INTO show_seats (show_id, seat_number, status)
    VALUES (?, ?, 'available')
  `);

  // Helper to generate the 80 seat codes (A1 to H10)
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const seatCodes: string[] = [];
  for (const row of rows) {
    for (let num = 1; num <= 10; num++) {
      seatCodes.push(`${row}${num}`);
    }
  }

  // Define upcoming show schedules (notice start times are well separated by duration + clean gap)
  const showsData = [
    // Today
    { movieId: movieIds[0], date: todayStr, time: '14:00', price: 250 },
    { movieId: movieIds[1], date: todayStr, time: '18:00', price: 300 },
    { movieId: movieIds[2], date: todayStr, time: '21:30', price: 350 },
    // Tomorrow
    { movieId: movieIds[3], date: tomorrowStr, time: '10:30', price: 200 },
    { movieId: movieIds[1], date: tomorrowStr, time: '14:00', price: 280 },
    { movieId: movieIds[2], date: tomorrowStr, time: '18:30', price: 320 },
  ];

  for (const s of showsData) {
    const showRes = insertShow.run(s.movieId, s.date, s.time, s.price);
    const showId = Number(showRes.lastInsertRowid);

    // Pre-populate all 80 seats for this show within a quick transaction
    const populateSeatsTx = db.transaction(() => {
      for (const seat of seatCodes) {
        insertSeat.run(showId, seat);
      }
    });
    populateSeatsTx();
  }

  console.log(`✅ Seeded ${showsData.length} Shows with 80 seats each (total ${showsData.length * 80} seats).`);
  console.log('🎉 Seeding completed successfully!');
}

// Execute if run directly from CLI
seedData();
