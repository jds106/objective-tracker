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

describe('Key Result Routes', () => {
  let app: Express;
  let dataDir: string;
  let token: string;
  let objectiveId: string;

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), 'ot-test-'));
    app = await createApp(testConfig(dataDir));

    // Register user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user@example.com',
        password: 'securepassword123',
        displayName: 'Test User',
        jobTitle: 'Engineer',
      });
    token = registerRes.body.data.token;

    // Create cycle
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

    // Create objective
    const objRes = await request(app)
      .post('/api/objectives')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cycleId: cycle.id,
        title: 'Test Objective',
        description: '',
        parentKeyResultId: null,
        parentObjectiveId: null,
        targetDate: '2026-12-31',
      });
    objectiveId = objRes.body.data.id;
  });

  afterEach(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  it('should create a percentage key result', async () => {
    const res = await request(app)
      .post(`/api/objectives/${objectiveId}/key-results`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Increase test coverage',
        type: 'percentage',
        config: { type: 'percentage', currentValue: 0 },
      })
      .expect(201);

    expect(res.body.data.title).toBe('Increase test coverage');
    expect(res.body.data.progress).toBe(0);
    expect(res.body.data.type).toBe('percentage');
  });

  it('should create a metric key result', async () => {
    const res = await request(app)
      .post(`/api/objectives/${objectiveId}/key-results`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Reduce latency',
        type: 'metric',
        config: {
          type: 'metric',
          startValue: 500,
          currentValue: 500,
          targetValue: 200,
          unit: 'ms',
          direction: 'decrease',
        },
      })
      .expect(201);

    expect(res.body.data.progress).toBe(0);
  });

  it('should create a milestone key result', async () => {
    const res = await request(app)
      .post(`/api/objectives/${objectiveId}/key-results`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Launch phases',
        type: 'milestone',
        config: {
          type: 'milestone',
          milestones: [
            { id: generateId(), title: 'Phase 1', completed: false },
            { id: generateId(), title: 'Phase 2', completed: false },
          ],
        },
      })
      .expect(201);

    expect(res.body.data.progress).toBe(0);
  });

  it('should create a binary key result', async () => {
    const res = await request(app)
      .post(`/api/objectives/${objectiveId}/key-results`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Ship feature X',
        type: 'binary',
        config: { type: 'binary', completed: false },
      })
      .expect(201);

    expect(res.body.data.progress).toBe(0);
  });

  it('should update a key result', async () => {
    const createRes = await request(app)
      .post(`/api/objectives/${objectiveId}/key-results`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Coverage',
        type: 'percentage',
        config: { type: 'percentage', currentValue: 0 },
      });

    const krId = createRes.body.data.id;

    const res = await request(app)
      .put(`/api/key-results/${krId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        config: { type: 'percentage', currentValue: 75 },
      })
      .expect(200);

    expect(res.body.data.progress).toBe(75);
  });

  it('should delete a key result', async () => {
    const createRes = await request(app)
      .post(`/api/objectives/${objectiveId}/key-results`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'To delete',
        type: 'binary',
        config: { type: 'binary', completed: false },
      });

    const krId = createRes.body.data.id;

    await request(app)
      .delete(`/api/key-results/${krId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
  });

  it('should record a check-in', async () => {
    const createRes = await request(app)
      .post(`/api/objectives/${objectiveId}/key-results`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Coverage',
        type: 'percentage',
        config: { type: 'percentage', currentValue: 0 },
      });

    const krId = createRes.body.data.id;

    const res = await request(app)
      .post(`/api/key-results/${krId}/check-in`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        config: { type: 'percentage', currentValue: 50 },
        note: 'Good progress this week',
        source: 'web',
      })
      .expect(201);

    expect(res.body.data.previousProgress).toBe(0);
    expect(res.body.data.newProgress).toBe(50);
    expect(res.body.data.note).toBe('Good progress this week');
  });
});
