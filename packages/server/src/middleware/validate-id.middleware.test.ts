import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { validateId } from './validate-id.middleware.js';

function createTestApp(paramName = 'id') {
  const app = express();

  app.get(`/test/:${paramName}`, validateId(paramName), (_req, res) => {
    res.json({ ok: true });
  });

  return app;
}

describe('validateId middleware', () => {
  const app = createTestApp();

  it('should pass through for a valid UUID v4', async () => {
    await request(app)
      .get('/test/550e8400-e29b-41d4-a716-446655440000')
      .expect(200, { ok: true });
  });

  it('should pass through for uppercase UUID', async () => {
    await request(app)
      .get('/test/550E8400-E29B-41D4-A716-446655440000')
      .expect(200, { ok: true });
  });

  it('should pass through for the special "company" ID', async () => {
    await request(app)
      .get('/test/company')
      .expect(200, { ok: true });
  });

  it('should reject a non-UUID string', async () => {
    const res = await request(app)
      .get('/test/not-a-uuid')
      .expect(400);

    expect(res.body.error).toMatch(/Invalid.*format/);
  });

  it('should reject an empty-looking ID (e.g. numeric)', async () => {
    const res = await request(app)
      .get('/test/12345')
      .expect(400);

    expect(res.body.error).toMatch(/Invalid.*format/);
  });

  it('should reject a UUID with wrong segment lengths', async () => {
    await request(app)
      .get('/test/550e8400-e29b-41d4-a716-44665544')
      .expect(400);
  });

  it('should reject path traversal attempts', async () => {
    await request(app)
      .get('/test/..%2F..%2Fetc%2Fpasswd')
      .expect(400);
  });

  it('should reject SQL injection attempts', async () => {
    await request(app)
      .get("/test/1'; DROP TABLE users--")
      .expect(400);
  });

  it('should work with custom param name', async () => {
    const customApp = createTestApp('objectiveId');

    await request(customApp)
      .get('/test/550e8400-e29b-41d4-a716-446655440000')
      .expect(200, { ok: true });

    const res = await request(customApp)
      .get('/test/invalid')
      .expect(400);

    expect(res.body.error).toMatch(/objectiveId/);
  });
});
