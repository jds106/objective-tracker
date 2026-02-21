import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { updateUserAdminSchema, companyObjectiveSchema, adminCreateUserSchema, createCycleSchema, updateCycleSchema, NotFoundError } from '@objective-tracker/shared';
import { validate } from '../middleware/validate.middleware.js';
import { createAuthMiddleware } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/require-admin.middleware.js';
import { PasswordAuthProvider } from '../auth/password-auth.provider.js';
import { logger } from '../logger.js';
import type { RouteDependencies } from './index.js';

export function createAdminRoutes(deps: RouteDependencies): Router {
    const router = Router();
    const auth = createAuthMiddleware(deps.authProvider);

    // All admin routes require authentication + admin role
    router.use(auth, requireAdmin);

    // ── User Management ────────────────────────────────────────

    /** Create a new user */
    router.post('/users', validate(adminCreateUserSchema), async (req, res, next) => {
        try {
            const { password, ...userData } = req.body;
            const existing = await deps.userRepo.getByEmail(userData.email);
            if (existing) {
                res.status(409).json({ error: 'An account with this email already exists' });
                return;
            }
            const passwordHash = await PasswordAuthProvider.hashPassword(password, deps.saltRounds);
            const user = await deps.userRepo.create({
                email: userData.email,
                displayName: userData.displayName,
                jobTitle: userData.jobTitle,
                managerId: userData.managerId ?? null,
                level: userData.level ?? 5,
                department: userData.department,
                role: userData.role ?? 'standard',
                passwordHash,
            });
            logger.info({ adminId: req.user!.id, createdUserId: user.id }, 'Admin created new user');
            res.status(201).json({ data: user });
        } catch (err) {
            next(err);
        }
    });

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
            logger.info({ adminId: req.user!.id, targetUserId: req.params.id, changes: Object.keys(req.body) }, 'Admin updated user');
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
            logger.info({ adminId: req.user!.id, deletedUserId: req.params.id }, 'Admin deleted user');
            res.status(204).send();
        } catch (err) {
            next(err);
        }
    });

    /** Admin-triggered password reset — generates a temp password */
    router.post('/users/:id/reset-password', async (req, res, next) => {
        try {
            const tempPassword = randomBytes(12).toString('base64url');
            const passwordHash = await PasswordAuthProvider.hashPassword(tempPassword, deps.saltRounds);
            await deps.userRepo.updatePassword(req.params.id, passwordHash);
            logger.info({ adminId: req.user!.id, targetUserId: req.params.id }, 'Admin triggered password reset');
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

    /** Admin-set password — set a specific password for a user */
    router.put('/users/:id/password', async (req, res, next) => {
        try {
            const { password } = req.body;
            if (!password || typeof password !== 'string' || password.length < 8) {
                res.status(400).json({ error: 'Password must be at least 8 characters' });
                return;
            }
            const passwordHash = await PasswordAuthProvider.hashPassword(password, deps.saltRounds);
            await deps.userRepo.updatePassword(req.params.id, passwordHash);
            logger.info({ adminId: req.user!.id, targetUserId: req.params.id }, 'Admin set user password');
            res.json({ data: { message: 'Password has been set.' } });
        } catch (err) {
            next(err);
        }
    });

    // ── Objectives ─────────────────────────────────────────────

    /** View all objectives across the organisation */
    router.get('/objectives', async (req, res, next) => {
        try {
            const cycleId = req.query.cycleId as string | undefined;
            // Get all users and fetch objectives for each (in parallel)
            const users = await deps.userRepo.getAll();
            const objectiveArrays = await Promise.all(
                users.map(user => deps.objectiveService.getByUserId(user.id, cycleId)),
            );
            const allObjectives = objectiveArrays.flat();
            // Also get company-level objectives — only swallow NotFoundError
            try {
                const companyObjectives = await deps.objectiveService.getByUserId('company', cycleId);
                allObjectives.push(...companyObjectives);
            } catch (err) {
                if (!(err instanceof NotFoundError)) {
                    throw err;
                }
            }
            res.json({ data: allObjectives });
        } catch (err) {
            next(err);
        }
    });

    // ── Cycles ────────────────────────────────────────────────

    /** Create a new objective cycle */
    router.post('/cycles', validate(createCycleSchema), async (req, res, next) => {
        try {
            const cycle = await deps.cycleService.create(req.body);
            logger.info({ adminId: req.user!.id, cycleId: cycle.id }, 'Admin created cycle');
            res.status(201).json({ data: cycle });
        } catch (err) {
            next(err);
        }
    });

    /** Update an existing cycle */
    router.put('/cycles/:id', validate(updateCycleSchema), async (req, res, next) => {
        try {
            const cycle = await deps.cycleService.update(req.params.id, req.body);
            logger.info({ adminId: req.user!.id, cycleId: cycle.id, changes: Object.keys(req.body) }, 'Admin updated cycle');
            res.json({ data: cycle });
        } catch (err) {
            if (err instanceof Error && err.message.includes('Invalid status transition')) {
                res.status(400).json({ error: err.message });
                return;
            }
            if (err instanceof Error && err.message.includes('Cannot activate')) {
                res.status(409).json({ error: err.message });
                return;
            }
            next(err);
        }
    });

    /** Bulk import users from CSV data */
    router.post('/users/import', async (req, res, next) => {
        try {
            const { rows } = req.body;
            if (!Array.isArray(rows) || rows.length === 0) {
                res.status(400).json({ error: 'Request body must contain a non-empty "rows" array' });
                return;
            }

            const results: Array<{ email: string; status: 'created' | 'skipped' | 'error'; message?: string }> = [];

            // First pass: resolve manager emails to IDs
            const allUsers = await deps.userRepo.getAll();
            const emailToUser = new Map(allUsers.map(u => [u.email.toLowerCase(), u]));

            for (const row of rows) {
                const email = (row.email ?? '').trim().toLowerCase();
                const displayName = (row.displayName ?? '').trim();
                const jobTitle = (row.jobTitle ?? '').trim();
                const department = (row.department ?? '').trim();
                const managerEmail = (row.managerEmail ?? '').trim().toLowerCase();
                const level = Number(row.level) || 5;

                if (!email || !displayName || !jobTitle) {
                    results.push({ email: email || '(empty)', status: 'error', message: 'Missing required fields: email, displayName, jobTitle' });
                    continue;
                }

                // Skip if user already exists
                if (emailToUser.has(email)) {
                    results.push({ email, status: 'skipped', message: 'User already exists' });
                    continue;
                }

                // Resolve manager
                let managerId: string | null = null;
                if (managerEmail) {
                    const manager = emailToUser.get(managerEmail);
                    if (manager) {
                        managerId = manager.id;
                    }
                    // If manager not found, import without manager — can be linked later
                }

                try {
                    // Generate a random initial password
                    const tempPassword = randomBytes(12).toString('base64url');
                    const passwordHash = await PasswordAuthProvider.hashPassword(tempPassword, deps.saltRounds);

                    const user = await deps.userRepo.create({
                        email,
                        displayName,
                        jobTitle,
                        managerId,
                        level,
                        department: department || undefined,
                        role: 'standard',
                        passwordHash,
                    });

                    // Add to lookup so subsequent rows can reference this user as a manager
                    emailToUser.set(email, { ...user, passwordHash: '' } as typeof allUsers[number]);

                    results.push({ email, status: 'created' });
                } catch (err) {
                    results.push({ email, status: 'error', message: err instanceof Error ? err.message : 'Unknown error' });
                }
            }

            const created = results.filter(r => r.status === 'created').length;
            const skipped = results.filter(r => r.status === 'skipped').length;
            const errors = results.filter(r => r.status === 'error').length;

            logger.info(
                { adminId: req.user!.id, created, skipped, errors },
                'Admin imported users from CSV',
            );

            res.json({
                data: {
                    results,
                    summary: { total: rows.length, created, skipped, errors },
                },
            });
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
