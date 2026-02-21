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
    FRONTEND_URL: 'http://localhost:5173',
    BCRYPT_SALT_ROUNDS: 4,
    ANTHROPIC_MODEL: 'claude-sonnet-4-20250514',
  };
}

const user1 = {
  email: 'user1@example.com',
  password: 'password123',
  displayName: 'User One',
  jobTitle: 'Engineer',
};

const manager = {
  email: 'manager@example.com',
  password: 'password123',
  displayName: 'Manager',
  jobTitle: 'Tech Lead',
};

async function registerAndLogin(app: Express, userData: typeof user1): Promise<{ token: string; userId: string }> {
  const res = await request(app).post('/api/auth/register').send(userData);
  return { token: res.body.data.token, userId: res.body.data.user.id };
}

describe('User Routes', () => {
  let app: Express;
  let dataDir: string;

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), 'ot-user-test-'));
    app = await createApp(testConfig(dataDir));
  });

  afterEach(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  // ── GET /api/users/me ──────────────────────────────────

  describe('GET /api/users/me', () => {
    it('should return the current user profile', async () => {
      const { token } = await registerAndLogin(app, user1);

      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.email).toBe(user1.email);
      expect(res.body.data.displayName).toBe(user1.displayName);
      expect(res.body.data.jobTitle).toBe(user1.jobTitle);
      expect(res.body.data.passwordHash).toBeUndefined();
    });

    it('should return 401 without token', async () => {
      await request(app).get('/api/users/me').expect(401);
    });
  });

  // ── PUT /api/users/me ──────────────────────────────────

  describe('PUT /api/users/me', () => {
    it('should update display name', async () => {
      const { token } = await registerAndLogin(app, user1);

      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ displayName: 'Updated Name' })
        .expect(200);

      expect(res.body.data.displayName).toBe('Updated Name');
    });

    it('should update job title', async () => {
      const { token } = await registerAndLogin(app, user1);

      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ jobTitle: 'Senior Engineer' })
        .expect(200);

      expect(res.body.data.jobTitle).toBe('Senior Engineer');
    });

    it('should update department', async () => {
      const { token } = await registerAndLogin(app, user1);

      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ department: 'Platform' })
        .expect(200);

      expect(res.body.data.department).toBe('Platform');
    });

    it('should reject empty displayName', async () => {
      const { token } = await registerAndLogin(app, user1);

      await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ displayName: '' })
        .expect(400);
    });
  });

  // ── POST /api/users/me/password ────────────────────────

  describe('POST /api/users/me/password', () => {
    it('should change password with correct current password', async () => {
      const { token } = await registerAndLogin(app, user1);

      await request(app)
        .post('/api/users/me/password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: user1.password, newPassword: 'newpassword123' })
        .expect(200);

      // Should be able to login with new password
      await request(app)
        .post('/api/auth/login')
        .send({ email: user1.email, password: 'newpassword123' })
        .expect(200);
    });

    it('should reject wrong current password', async () => {
      const { token } = await registerAndLogin(app, user1);

      await request(app)
        .post('/api/users/me/password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'wrongpassword', newPassword: 'newpassword123' })
        .expect(400);
    });

    it('should reject short new password', async () => {
      const { token } = await registerAndLogin(app, user1);

      await request(app)
        .post('/api/users/me/password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: user1.password, newPassword: 'short' })
        .expect(400);
    });
  });

  // ── GET /api/users/me/reports ──────────────────────────

  describe('GET /api/users/me/reports', () => {
    it('should return empty array when user has no reports', async () => {
      const { token } = await registerAndLogin(app, user1);

      const res = await request(app)
        .get('/api/users/me/reports')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toEqual([]);
    });

    it('should return direct reports', async () => {
      // First user is admin (manager)
      const { token: adminToken, userId: adminId } = await registerAndLogin(app, manager);

      // Register user1 with admin as manager
      await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...user1, managerId: adminId });

      const res = await request(app)
        .get('/api/users/me/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].email).toBe(user1.email);
    });
  });

  // ── GET /api/users/me/chain ────────────────────────────

  describe('GET /api/users/me/chain', () => {
    it('should return empty chain for top-level user', async () => {
      const { token } = await registerAndLogin(app, manager);

      const res = await request(app)
        .get('/api/users/me/chain')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toEqual([]);
    });

    it('should return upward reporting chain', async () => {
      const { token: adminToken, userId: adminId } = await registerAndLogin(app, manager);

      // Create user1 reporting to admin
      const createRes = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...user1, managerId: adminId });
      const user1Id = createRes.body.data.id;

      // Login as user1
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: user1.email, password: user1.password });
      const user1Token = loginRes.body.data.token;

      const res = await request(app)
        .get('/api/users/me/chain')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.some((u: { id: string }) => u.id === adminId)).toBe(true);
    });
  });

  // ── GET /api/users/:id ─────────────────────────────────

  describe('GET /api/users/:id', () => {
    it('should return a user when requester has visibility', async () => {
      const { token: adminToken, userId: adminId } = await registerAndLogin(app, manager);

      // Create user1 reporting to admin
      const createRes = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...user1, managerId: adminId });
      const user1Id = createRes.body.data.id;

      const res = await request(app)
        .get(`/api/users/${user1Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.email).toBe(user1.email);
    });

    it('should return 403 when requester lacks visibility', async () => {
      // Register admin (first user)
      const { token: adminToken, userId: adminId } = await registerAndLogin(app, manager);

      // Create two separate users who don't have mutual visibility
      const createA = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...user1, managerId: adminId });
      const userAId = createA.body.data.id;

      const user2 = {
        email: 'user2@example.com',
        password: 'password123',
        displayName: 'User Two',
        jobTitle: 'Designer',
      };
      const createB = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...user2, managerId: adminId });
      const userBId = createB.body.data.id;

      // Login as user A
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: user1.email, password: user1.password });
      const tokenA = loginRes.body.data.token;

      // User A cannot see User B (both at same level under same manager but no downward/upward relationship)
      await request(app)
        .get(`/api/users/${userBId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(403);
    });
  });

  // ── GET /api/users/:id/objectives ──────────────────────

  describe('GET /api/users/:id/objectives', () => {
    it('should return objectives for a visible user', async () => {
      const { token: adminToken, userId: adminId } = await registerAndLogin(app, manager);

      // Admin sees their own objectives
      const res = await request(app)
        .get(`/api/users/${adminId}/objectives`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('should return 403 for objectives of an invisible user', async () => {
      const { token: adminToken, userId: adminId } = await registerAndLogin(app, manager);

      // Create two peer users
      const createA = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...user1, managerId: adminId });

      const user2 = {
        email: 'user2b@example.com',
        password: 'password123',
        displayName: 'User Two',
        jobTitle: 'Designer',
      };
      const createB = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...user2, managerId: adminId });

      // Login as user A, try to see user B's objectives
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: user1.email, password: user1.password });
      const tokenA = loginRes.body.data.token;

      await request(app)
        .get(`/api/users/${createB.body.data.id}/objectives`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(403);
    });
  });
});
