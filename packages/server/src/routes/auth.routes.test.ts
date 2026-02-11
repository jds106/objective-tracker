import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Express } from 'express';
import { createApp } from '../app.js';
import type { Config } from '../config.js';

function testConfig(dataDir: string): Config {
  return {
    PORT: 0,
    DATA_DIR: dataDir,
    JWT_SECRET: 'test-secret-that-is-at-least-32-characters-long',
    JWT_EXPIRY: '1h',
  };
}

const testUser = {
  email: 'test@example.com',
  password: 'securepassword123',
  displayName: 'Test User',
  jobTitle: 'Engineer',
};

describe('Auth Routes', () => {
  let app: Express;
  let dataDir: string;

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), 'ot-test-'));
    app = await createApp(testConfig(dataDir));
  });

  afterEach(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  it('should register a new user and return a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    expect(res.body.data.user.email).toBe('test@example.com');
    expect(res.body.data.user.displayName).toBe('Test User');
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.expiresAt).toBeDefined();
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('should reject duplicate email registration', async () => {
    await request(app).post('/api/auth/register').send(testUser).expect(201);
    await request(app).post('/api/auth/register').send(testUser).expect(409);
  });

  it('should reject registration with invalid email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ ...testUser, email: 'not-an-email' })
      .expect(400);
  });

  it('should reject registration with short password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ ...testUser, password: 'short' })
      .expect(400);
  });

  it('should login with valid credentials', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email);
  });

  it('should reject login with wrong password', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword1' })
      .expect(401);
  });

  it('should reject login with non-existent email', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' })
      .expect(401);
  });

  it('should return 401 for protected routes without token', async () => {
    await request(app).get('/api/users/me').expect(401);
  });

  it('should access protected routes with valid token', async () => {
    const registerRes = await request(app).post('/api/auth/register').send(testUser);
    const token = registerRes.body.data.token;

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.email).toBe(testUser.email);
  });

  it('should revoke token on logout', async () => {
    const registerRes = await request(app).post('/api/auth/register').send(testUser);
    const token = registerRes.body.data.token;

    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });
});
