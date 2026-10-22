import request from 'supertest';
import { app } from '../app.js';
import { db } from '../db/database.js';

describe('Flow 1: Sign up and log in', () => {
  const testEmail = `test_${Date.now()}@example.com`;

  afterAll(() => {
    // Clean up test users
    db.prepare("DELETE FROM users WHERE email LIKE 'test_%@example.com'").run();
  });

  it('rejects signup with short password (less than 8 chars)', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Short Pass User',
        email: `short_${Date.now()}@example.com`,
        password: '123'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('at least 8 characters');
  });

  it('allows a new user to sign up and assigns customer role', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Alice Tester',
        email: testEmail,
        password: 'password123'
      });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.user.role).toBe('customer'); // Regular signup NEVER creates admin
  });

  it('rejects signup if email already exists with clear error', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Duplicate Alice',
        email: testEmail,
        password: 'password123'
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('already exists');
  });

  it('rejects login with wrong password without revealing which was wrong', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'wrong_password_999'
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password.');
  });

  it('logs in successfully with valid credentials and returns JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'password123'
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.name).toBe('Alice Tester');
  });
});
