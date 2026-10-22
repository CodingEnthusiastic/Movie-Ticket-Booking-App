import request from 'supertest';
import { app } from '../app.js';
import { db } from '../db/database.js';

describe('Flow 7: Shows and Overlap Prevention', () => {
  let adminToken: string;
  let customerToken: string;
  let testMovieId: number;

  beforeAll(async () => {
    // 1. Log in admin (seeded earlier)
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@cinema.com', password: 'admin123456' });
    adminToken = adminRes.body.token;

    // 2. Log in regular customer
    const custRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer@cinema.com', password: 'password123' });
    customerToken = custRes.body.token;

    // 3. Create a test movie with 120 min duration (2 hours)
    const movieRes = await request(app)
      .post('/api/movies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Overlap Test Movie',
        description: 'Testing show collision detection',
        language: 'English',
        duration_mins: 120,
        rating: 'UA'
      });
    testMovieId = movieRes.body.movie.id;
  });

  afterAll(() => {
    if (testMovieId) {
      db.prepare('DELETE FROM shows WHERE movie_id = ?').run(testMovieId);
      db.prepare('DELETE FROM movies WHERE id = ?').run(testMovieId);
    }
  });

  it('blocks regular customers from adding shows (403)', async () => {
    const res = await request(app)
      .post('/api/shows')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        movie_id: testMovieId,
        show_date: '2028-12-01',
        start_time: '14:00',
        ticket_price: 250
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Admin privileges required');
  });

  it('allows admin to schedule a new show with 80 seats initialized', async () => {
    // Show 1: 14:00 to 16:00 (120 mins duration)
    const res = await request(app)
      .post('/api/shows')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        movie_id: testMovieId,
        show_date: '2028-12-01',
        start_time: '14:00',
        ticket_price: 250
      });

    expect(res.status).toBe(201);
    expect(res.body.showId).toBeDefined();

    // Verify 80 seats were created
    const count = db.prepare('SELECT COUNT(*) as c FROM show_seats WHERE show_id = ?').get(res.body.showId) as { c: number };
    expect(count.c).toBe(80);
  });

  it('rejects scheduling an overlapping show on the same screen (Flow 7 rule)', async () => {
    // Attempting to schedule a show at 15:00 on the same date.
    // The previous show runs from 14:00 to 16:00, so 15:00 is directly inside the running window!
    const res = await request(app)
      .post('/api/shows')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        movie_id: testMovieId,
        show_date: '2028-12-01',
        start_time: '15:00',
        ticket_price: 300
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Time conflict');
    expect(res.body.error).toContain('Two shows on the same screen cannot overlap');
  });

  it('allows scheduling a show that starts after the previous show finishes', async () => {
    // Previous show finishes at 16:00. This show starts at 16:30.
    const res = await request(app)
      .post('/api/shows')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        movie_id: testMovieId,
        show_date: '2028-12-01',
        start_time: '16:30',
        ticket_price: 300
      });

    expect(res.status).toBe(201);
  });
});
