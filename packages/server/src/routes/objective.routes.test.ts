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

describe('Objective Routes', () => {
  let app: Express;
  let dataDir: string;
  let token: string;
  let cycleId: string;

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), 'ot-test-'));
    app = await createApp(testConfig(dataDir));

    // Register a user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user@example.com',
        password: 'securepassword123',
        displayName: 'Test User',
        jobTitle: 'Engineer',
      });
    token = registerRes.body.data.token;

    // Create a cycle
    const { JsonCycleRepository } = await import('../repositories/json-cycle.repository.js');
    const cycleRepo = new JsonCycleRepository(dataDir);
    await cycleRepo.init();
    const cycle = await cycleRepo.create({
      name: 'FY2026',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      quarters: [
        { id: 'q1', name: 'Q1', startDate: '2026-01-01', endDate: '2026-03-31', reviewDeadline: '2026-03-25' },
      ],
      status: 'active',
    });
    cycleId = cycle.id;
  });

  afterEach(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  it('should create an objective', async () => {
    const res = await request(app)
      .post('/api/objectives')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cycleId,
        title: 'Improve system reliability',
        description: 'Reduce downtime and improve monitoring',
        parentKeyResultId: null,
        parentObjectiveId: null,
      })
      .expect(201);

    expect(res.body.data.title).toBe('Improve system reliability');
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.id).toBeDefined();
  });

  it('should list user objectives', async () => {
    await request(app)
      .post('/api/objectives')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cycleId,
        title: 'Objective 1',
        description: '',
        parentKeyResultId: null,
        parentObjectiveId: null,
      });

    await request(app)
      .post('/api/objectives')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cycleId,
        title: 'Objective 2',
        description: '',
        parentKeyResultId: null,
        parentObjectiveId: null,
      });

    const res = await request(app)
      .get('/api/objectives')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data).toHaveLength(2);
  });

  it('should get an objective by id', async () => {
    const createRes = await request(app)
      .post('/api/objectives')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cycleId,
        title: 'My Objective',
        description: 'Description',
        parentKeyResultId: null,
        parentObjectiveId: null,
      });

    const id = createRes.body.data.id;

    const res = await request(app)
      .get(`/api/objectives/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.title).toBe('My Objective');
  });

  it('should update an objective', async () => {
    const createRes = await request(app)
      .post('/api/objectives')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cycleId,
        title: 'Original Title',
        description: '',
        parentKeyResultId: null,
        parentObjectiveId: null,
      });

    const id = createRes.body.data.id;

    const res = await request(app)
      .put(`/api/objectives/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Title' })
      .expect(200);

    expect(res.body.data.title).toBe('Updated Title');
  });

  it('should delete a draft objective', async () => {
    const createRes = await request(app)
      .post('/api/objectives')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cycleId,
        title: 'To Delete',
        description: '',
        parentKeyResultId: null,
        parentObjectiveId: null,
      });

    const id = createRes.body.data.id;

    await request(app)
      .delete(`/api/objectives/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    await request(app)
      .get(`/api/objectives/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('should reject deleting a non-draft objective', async () => {
    const createRes = await request(app)
      .post('/api/objectives')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cycleId,
        title: 'Active Objective',
        description: '',
        parentKeyResultId: null,
        parentObjectiveId: null,
      });

    const id = createRes.body.data.id;

    await request(app)
      .put(`/api/objectives/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'active' });

    await request(app)
      .delete(`/api/objectives/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('should reject invalid status transitions', async () => {
    const createRes = await request(app)
      .post('/api/objectives')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cycleId,
        title: 'Test',
        description: '',
        parentKeyResultId: null,
        parentObjectiveId: null,
      });

    const id = createRes.body.data.id;

    await request(app)
      .put(`/api/objectives/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'completed' })
      .expect(400);
  });
});
