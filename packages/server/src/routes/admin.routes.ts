import { Router } from 'express';
import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { updateUserAdminSchema, companyObjectiveSchema } from '@objective-tracker/shared';
import { validate } from '../middleware/validate.middleware.js';
import { createAuthMiddleware } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/require-admin.middleware.js';
import type { RouteDependencies } from './index.js';

const SALT_ROUNDS = 12;

export function createAdminRoutes(deps: RouteDependencies): Router {
    const router = Router();
    const auth = createAuthMiddleware(deps.authProvider);

    // All admin routes require authentication + admin role
    router.use(auth, requireAdmin);

    // ── User Management ────────────────────────────────────────

    /** List all users */
    router.get('/users', async (req, res, next) => {
        try {
            const users = await deps.userRepo.getAll();
            res.json({ data: users });
        } catch (err) {
            next(err);
        }
    });

    /** Update a user (role, department, manager, etc.) */
    router.put('/users/:id', validate(updateUserAdminSchema), async (req, res, next) => {
        try {
            const user = await deps.userRepo.update(req.params.id, req.body);
            res.json({ data: user });
        } catch (err) {
            next(err);
        }
    });

    /** Delete a user (cannot delete yourself) */
    router.delete('/users/:id', async (req, res, next) => {
        try {
            if (req.params.id === req.user!.id) {
                res.status(400).json({ error: 'You cannot delete your own account' });
                return;
            }
            await deps.userRepo.delete(req.params.id);
            res.status(204).send();
        } catch (err) {
            next(err);
        }
    });

    /** Admin-triggered password reset — generates a temp password */
    router.post('/users/:id/reset-password', async (req, res, next) => {
        try {
            const tempPassword = randomBytes(12).toString('base64url');
            const passwordHash = await bcrypt.hash(tempPassword, SALT_ROUNDS);
            await deps.userRepo.updatePassword(req.params.id, passwordHash);
            res.json({
                data: {
                    message: 'Password has been reset.',
                    temporaryPassword: tempPassword,
                },
            });
        } catch (err) {
            next(err);
        }
    });

    // ── Objectives ─────────────────────────────────────────────

    /** View all objectives across the organisation */
    router.get('/objectives', async (req, res, next) => {
        try {
            const cycleId = req.query.cycleId as string | undefined;
            // Get all users and fetch objectives for each
            const users = await deps.userRepo.getAll();
            const allObjectives = [];
            for (const user of users) {
                const objectives = await deps.objectiveService.getByUserId(user.id, cycleId);
                allObjectives.push(...objectives);
            }
            // Also get company-level objectives
            try {
                const companyObjectives = await deps.objectiveService.getByUserId('company', cycleId);
                allObjectives.push(...companyObjectives);
            } catch {
                // No company objectives yet — fine
            }
            res.json({ data: allObjectives });
        } catch (err) {
            next(err);
        }
    });

    /** Create a company-level root objective */
    router.post('/objectives/company', validate(companyObjectiveSchema), async (req, res, next) => {
        try {
            const { title, description, cycleId } = req.body;
            const objective = await deps.objectiveService.create('company', {
                cycleId,
                title,
                description: description ?? '',
                parentKeyResultId: null,
                parentObjectiveId: null,
            });
            res.status(201).json({ data: objective });
        } catch (err) {
            next(err);
        }
    });

    return router;
}
