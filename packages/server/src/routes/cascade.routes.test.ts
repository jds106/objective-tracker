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
  };
}

const adminUser = {
  email: 'admin@example.com',
  password: 'password123',
  displayName: 'Admin CTO',
  jobTitle: 'CTO',
};

describe('Cascade Routes', () => {
  let app: Express;
  let dataDir: string;
  let adminToken: string;

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), 'ot-cascade-test-'));
    app = await createApp(testConfig(dataDir));

    // Register admin user
    const res = await request(app).post('/api/auth/register').send(adminUser);
    adminToken = res.body.data.token;
  });

  afterEach(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  describe('GET /api/cascade/tree', () => {
    it('should return 401 without authentication', async () => {
      await request(app).get('/api/cascade/tree').expect(401);
    });

    it('should return empty tree when no objectives exist', async () => {
      const res = await request(app)
        .get('/api/cascade/tree')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toEqual([]);
    });

    it('should return tree with company objectives', async () => {
      // First create a cycle
      const { JsonCycleRepository } = await import('../repositories/index.js');
      const cycleRepo = new JsonCycleRepository(dataDir);
      await cycleRepo.init();
      const cycle = await cycleRepo.create({
        name: 'FY2026',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        quarters: [{
          id: generateId(),
          name: 'Q1',
          startDate: '2026-01-01',
          endDate: '2026-03-31',
          reviewDeadline: '2026-04-07',
        }],
        status: 'active',
      });

      // Create a company objective
      await request(app)
        .post('/api/admin/objectives/company')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cycleId: cycle.id, title: 'Increase revenue' });

      // Now fetch cascade tree
      const res = await request(app)
        .get('/api/cascade/tree')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      const companyNode = res.body.data.find((n: { owner: { id: string } }) => n.owner.id === 'company');
      expect(companyNode).toBeDefined();
      expect(companyNode.objective.title).toBe('Increase revenue');
    });

    it('should only show objectives within visibility scope for standard users', async () => {
      // Create a cycle
      const { JsonCycleRepository } = await import('../repositories/index.js');
      const cycleRepo = new JsonCycleRepository(dataDir);
      await cycleRepo.init();
      const cycle = await cycleRepo.create({
        name: 'FY2026',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        quarters: [{
          id: generateId(),
          name: 'Q1',
          startDate: '2026-01-01',
          endDate: '2026-03-31',
          reviewDeadline: '2026-04-07',
        }],
        status: 'active',
      });

      // Create two standard users under admin
      const adminId = (await request(app).get('/api/users/me').set('Authorization', `Bearer ${adminToken}`)).body.data.id;

      const user1 = { email: 'u1@test.com', password: 'password123', displayName: 'User 1', jobTitle: 'Engineer', managerId: adminId };
      const user2 = { email: 'u2@test.com', password: 'password123', displayName: 'User 2', jobTitle: 'Designer', managerId: adminId };

      await request(app).post('/api/admin/users').set('Authorization', `Bearer ${adminToken}`).send(user1);
      await request(app).post('/api/admin/users').set('Authorization', `Bearer ${adminToken}`).send(user2);

      // Login as user 1
      const loginRes = await request(app).post('/api/auth/login').send({ email: 'u1@test.com', password: 'password123' });
      const user1Token = loginRes.body.data.token;
      const user1Id = loginRes.body.data.user.id;

      // Create an objective for user 1
      await request(app)
        .post('/api/objectives')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ cycleId: cycle.id, title: 'User 1 objective' });

      // Login as user 2
      const login2Res = await request(app).post('/api/auth/login').send({ email: 'u2@test.com', password: 'password123' });
      const user2Token = login2Res.body.data.token;

      // User 2 should NOT see user 1's objective (peers, no direct relationship)
      const res = await request(app)
        .get('/api/cascade/tree')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      const allTitles = flattenTitles(res.body.data);
      expect(allTitles).not.toContain('User 1 objective');
    });

    it('should filter by cycleId query parameter', async () => {
      const res = await request(app)
        .get('/api/cascade/tree?cycleId=nonexistent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toEqual([]);
    });
  });
});

function flattenTitles(nodes: { objective: { title: string }; children: unknown[] }[]): string[] {
  const result: string[] = [];
  for (const node of nodes) {
    result.push(node.objective.title);
    result.push(...flattenTitles(node.children as typeof nodes));
  }
  return result;
}
