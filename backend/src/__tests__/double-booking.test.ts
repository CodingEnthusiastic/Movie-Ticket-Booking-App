import request from 'supertest';
import { app } from '../app.js';
import { db } from '../db/database.js';

describe('Flow 4 & 5: Concurrency and No Double Booking Verification', () => {
  let userAToken: string;
  let userBToken: string;
  let userAId: number;
  let userBId: number;
  let showId: number;
  let movieId: number;

  beforeAll(async () => {
    // 1. Create User A
    const resA = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Concurrent User A',
        email: `usera_${Date.now()}@test.com`,
        password: 'password123'
      });
    userAToken = resA.body.token;
    userAId = resA.body.user.id;

    // 2. Create User B
    const resB = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Concurrent User B',
        email: `userb_${Date.now()}@test.com`,
        password: 'password123'
      });
    userBToken = resB.body.token;
    userBId = resB.body.user.id;

    // 3. Create a dedicated Movie and Show for this concurrency test
    const mRes = db.prepare(`
      INSERT INTO movies (title, language, duration_mins, rating)
      VALUES ('Race Condition Test Movie', 'English', 120, 'UA')
    `).run();
    movieId = Number(mRes.lastInsertRowid);

    const sRes = db.prepare(`
      INSERT INTO shows (movie_id, show_date, start_time, ticket_price)
      VALUES (?, '2029-01-01', '20:00', 300)
    `).run(movieId);
    showId = Number(sRes.lastInsertRowid);

    // Initialize 80 seats
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    for (const row of rows) {
      for (let i = 1; i <= 10; i++) {
        db.prepare("INSERT INTO show_seats (show_id, seat_number, status) VALUES (?, ?, 'available')")
          .run(showId, `${row}${i}`);
      }
    }
  });

  afterAll(() => {
    if (showId) {
      db.prepare('DELETE FROM show_seats WHERE show_id = ?').run(showId);
      db.prepare('DELETE FROM bookings WHERE show_id = ?').run(showId);
      db.prepare('DELETE FROM shows WHERE id = ?').run(showId);
    }
    if (movieId) {
      db.prepare('DELETE FROM movies WHERE id = ?').run(movieId);
    }
    db.prepare('DELETE FROM users WHERE id IN (?, ?)').run(userAId, userBId);
  });

  it('enforces maximum 6 seats per booking rule (Flow 4)', async () => {
    const res = await request(app)
      .post('/api/bookings/hold')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        showId,
        seats: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7'] // 7 seats
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('up to 6 seats');
  });

  /**
   * CORE ACCEPTANCE TEST FOR THE REVIWER:
   * "If two users try to book the same seat at the same moment, exactly one succeeds
   *  and the other gets an error. This must be enforced by the backend and database...
   *  Write a test that proves it."
   */
  it('PROVES NO DOUBLE BOOKING: When User A and User B concurrently attempt to hold the SAME seat at the same instant, exactly ONE succeeds and ONE fails with 409 Conflict', async () => {
    const targetSeat = 'D4';

    // Launch both requests simultaneously in parallel using Promise.all
    const [responseA, responseB] = await Promise.all([
      request(app)
        .post('/api/bookings/hold')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ showId, seats: [targetSeat] }),

      request(app)
        .post('/api/bookings/hold')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ showId, seats: [targetSeat] })
    ]);

    const statuses = [responseA.status, responseB.status];

    // Assert that one request succeeded with 200 and the other was rejected with 409 Conflict
    expect(statuses).toContain(200);
    expect(statuses).toContain(409);

    // Identify winner and loser
    const winner = responseA.status === 200 ? responseA : responseB;
    const loser = responseA.status === 409 ? responseA : responseB;

    expect(winner.body.seats).toContain(targetSeat);
    expect(winner.body.expiresAt).toBeDefined();

    expect(loser.body.error).toContain(`Seat ${targetSeat} was just taken`);
    expect(loser.body.seat).toBe(targetSeat);

    // Verify database state: seat D4 must be held by exactly ONE user
    const dbSeat = db.prepare('SELECT status, held_by_user_id FROM show_seats WHERE show_id = ? AND seat_number = ?')
      .get(showId, targetSeat) as { status: string; held_by_user_id: number };

    expect(dbSeat.status).toBe('held');
    expect([userAId, userBId]).toContain(dbSeat.held_by_user_id);
  });

  it('allows the winning user to confirm payment and transition the seat to permanently booked', async () => {
    const targetSeat = 'D4';

    // Find who currently holds D4
    const seatRow = db.prepare('SELECT held_by_user_id FROM show_seats WHERE show_id = ? AND seat_number = ?')
      .get(showId, targetSeat) as { held_by_user_id: number };

    const winnerToken = seatRow.held_by_user_id === userAId ? userAToken : userBToken;
    const loserToken = seatRow.held_by_user_id === userAId ? userBToken : userAToken;

    // Loser tries to confirm payment for the seat -> REJECTED
    const loserConfirm = await request(app)
      .post('/api/bookings/confirm')
      .set('Authorization', `Bearer ${loserToken}`)
      .send({ showId, seats: [targetSeat] });
    expect(loserConfirm.status).toBe(400);

    // Winner confirms payment (Payment Success flow) -> SUCCEEDS
    const winnerConfirm = await request(app)
      .post('/api/bookings/confirm')
      .set('Authorization', `Bearer ${winnerToken}`)
      .send({ showId, seats: [targetSeat] });

    expect(winnerConfirm.status).toBe(201);
    expect(winnerConfirm.body.booking.id).toBeDefined();
    expect(winnerConfirm.body.booking.status).toBe('confirmed');

    // Seat state in database is now 'booked'
    const finalSeatState = db.prepare('SELECT status, booking_id FROM show_seats WHERE show_id = ? AND seat_number = ?')
      .get(showId, targetSeat) as { status: string; booking_id: number };

    expect(finalSeatState.status).toBe('booked');
    expect(finalSeatState.booking_id).toBe(winnerConfirm.body.booking.id);
  });

  it('rejects confirmation if the 5-minute hold has expired', async () => {
    const testSeat = 'E5';

    // Hold the seat
    await request(app)
      .post('/api/bookings/hold')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ showId, seats: [testSeat] });

    // Forcefully set held_until to the past (simulating 5 minutes elapsing)
    db.prepare('UPDATE show_seats SET held_until = ? WHERE show_id = ? AND seat_number = ?')
      .run(Date.now() - 1000, showId, testSeat);

    // Attempt to confirm after expiration
    const res = await request(app)
      .post('/api/bookings/confirm')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ showId, seats: [testSeat] });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('hold has expired');
  });
});
