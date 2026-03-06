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
    AI_PROVIDER: 'anthropic' as const,
    ANTHROPIC_MODEL: 'claude-sonnet-4-20250514',
    OLLAMA_BASE_URL: 'http://localhost:11434',
    OLLAMA_MODEL: 'deepseek-r1:14b-qwen-distill-q8_0',
    };
}

const adminUser = {
    email: 'admin@example.com',
    password: 'securepassword123',
    displayName: 'Admin User',
    jobTitle: 'CTO',
};

const standardUser = {
    email: 'standard@example.com',
    password: 'securepassword123',
    displayName: 'Standard User',
    jobTitle: 'Engineer',
};

describe('Admin Routes', () => {
    let app: Express;
    let dataDir: string;

    beforeEach(async () => {
        dataDir = await mkdtemp(join(tmpdir(), 'admin-test-'));
        app = await createApp(testConfig(dataDir));
    });

    afterEach(async () => {
        await rm(dataDir, { recursive: true, force: true });
    });

    async function registerAndLogin(user: typeof adminUser) {
        const res = await request(app).post('/api/auth/register').send(user);
        return {
            token: res.body.data.token,
            user: res.body.data.user,
        };
    }

    it('should assign admin role to the first registered user', async () => {
        const { user } = await registerAndLogin(adminUser);
        expect(user.role).toBe('admin');
    });

    it('should assign standard role to subsequent users', async () => {
        await registerAndLogin(adminUser);
        const { user } = await registerAndLogin(standardUser);
        expect(user.role).toBe('standard');
    });

    it('should allow admin to list all users', async () => {
        const { token } = await registerAndLogin(adminUser);
        await registerAndLogin(standardUser);

        const res = await request(app)
            .get('/api/admin/users')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(res.body.data).toHaveLength(2);
    });

    it('should return 403 for standard user on admin routes', async () => {
        await registerAndLogin(adminUser);
        const { token } = await registerAndLogin(standardUser);

        await request(app)
            .get('/api/admin/users')
            .set('Authorization', `Bearer ${token}`)
            .expect(403);
    });

    it('should allow admin to update a user role', async () => {
        const { token } = await registerAndLogin(adminUser);
        const { user: std } = await registerAndLogin(standardUser);

        const res = await request(app)
            .put(`/api/admin/users/${std.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ role: 'admin' })
            .expect(200);

        expect(res.body.data.role).toBe('admin');
    });

    it('should prevent admin from deleting themselves', async () => {
        const { token, user } = await registerAndLogin(adminUser);

        await request(app)
            .delete(`/api/admin/users/${user.id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(400);
    });

    it('should allow admin to delete another user', async () => {
        const { token } = await registerAndLogin(adminUser);
        const { user: std } = await registerAndLogin(standardUser);

        await request(app)
            .delete(`/api/admin/users/${std.id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(204);

        // Verify user is gone
        const res = await request(app)
            .get('/api/admin/users')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(res.body.data).toHaveLength(1);
    });

    it('should allow admin to reset another user password', async () => {
        const { token } = await registerAndLogin(adminUser);
        const { user: std } = await registerAndLogin(standardUser);

        const res = await request(app)
            .post(`/api/admin/users/${std.id}/reset-password`)
            .set('Authorization', `Bearer ${token}`)
            .send({})
            .expect(200);

        expect(res.body.data.temporaryPassword).toBeDefined();

        // Verify the user can log in with the new password
        await request(app)
            .post('/api/auth/login')
            .send({ email: standardUser.email, password: res.body.data.temporaryPassword })
            .expect(200);
    });

    it('should allow admin to create a company objective', async () => {
        const { token } = await registerAndLogin(adminUser);

        // Seed a cycle directly via the filesystem (POST /cycles not yet implemented)
        const { writeFile } = await import('node:fs/promises');
        const cycleId = '00000000-0000-0000-0000-000000000001';
        await writeFile(
            join(dataDir, 'cycles.json'),
            JSON.stringify({
                version: 1,
                cycles: [{
                    id: cycleId,
                    name: 'Q1 2025',
                    startDate: '2025-01-01',
                    endDate: '2025-03-31',
                    status: 'active',
                    quarters: [{ id: 'q1', name: 'Q1', startDate: '2025-01-01', endDate: '2025-03-31', reviewDeadline: '2025-03-25' }],
                }],
            }),
        );

        const res = await request(app)
            .post('/api/admin/objectives/company')
            .set('Authorization', `Bearer ${token}`)
            .send({ cycleId, title: 'Grow Revenue 20%', description: 'Company wide goal', targetDate: '2026-12-31' })
            .expect(201);

        expect(res.body.data.ownerId).toBe('company');
        expect(res.body.data.title).toBe('Grow Revenue 20%');
    });

    it('should allow admin to view all objectives', async () => {
        const { token } = await registerAndLogin(adminUser);

        const res = await request(app)
            .get('/api/admin/objectives')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(Array.isArray(res.body.data)).toBe(true);
    });
});
