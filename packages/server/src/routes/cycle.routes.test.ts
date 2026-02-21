import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Express } from 'express';
import { createApp } from '../app.js';
import type { Config } from '../config.js';
import { generateId } from '@objective-tracker/shared';

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

const adminUser = {
  email: 'admin@example.com',
  password: 'password123',
  displayName: 'Admin',
  jobTitle: 'CTO',
};

describe('Cycle Routes', () => {
  let app: Express;
  let dataDir: string;
  let adminToken: string;

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), 'ot-cycle-test-'));
    app = await createApp(testConfig(dataDir));

    // Register admin user (first user gets admin role)
    const res = await request(app).post('/api/auth/register').send(adminUser);
    adminToken = res.body.data.token;
  });

  afterEach(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  describe('GET /api/cycles', () => {
    it('should return empty array when no cycles exist', async () => {
      const res = await request(app)
        .get('/api/cycles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toEqual([]);
    });

    it('should return 401 without authentication', async () => {
      await request(app).get('/api/cycles').expect(401);
    });
  });

  describe('GET /api/cycles/active', () => {
    it('should return 404 when no active cycle exists', async () => {
      await request(app)
        .get('/api/cycles/active')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      await request(app).get('/api/cycles/active').expect(401);
    });
  });
});
