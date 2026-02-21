import { join, resolve, relative } from 'node:path';
import { mkdir, unlink } from 'node:fs/promises';
import { Router } from 'express';
import multer from 'multer';
import { updateProfileSchema, changePasswordSchema } from '@objective-tracker/shared';
import { createAuthMiddleware } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate-id.middleware.js';
import type { PasswordAuthProvider } from '../auth/password-auth.provider.js';
import type { RouteDependencies } from './index.js';

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

export function createUserRoutes(deps: RouteDependencies): Router {
  const router = Router();
  const auth = createAuthMiddleware(deps.authProvider);

  const avatarDir = join(deps.dataDir, 'avatars');
  const storage = multer.diskStorage({
    destination: async (_req, _file, cb) => {
      await mkdir(avatarDir, { recursive: true });
      cb(null, avatarDir);
    },
    filename: (req, file, cb) => {
      const ext = file.mimetype === 'image/png' ? 'png'
        : file.mimetype === 'image/webp' ? 'webp'
        : 'jpg';
      cb(null, `${req.user!.id}.${ext}`);
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only PNG, JPEG, and WebP images are allowed'));
      }
    },
  });

  router.get('/me', auth, async (req, res, next) => {
    try {
      const user = await deps.userService.getById(req.user!.id);
      res.json({ data: user });
    } catch (err) {
      next(err);
    }
  });

  router.put('/me', auth, async (req, res, next) => {
    try {
      const result = updateProfileSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
        return;
      }

      const user = await deps.userRepo.update(req.user!.id, result.data);
      res.json({ data: user });
    } catch (err) {
      next(err);
    }
  });

  router.post('/me/password', auth, async (req, res, next) => {
    try {
      const result = changePasswordSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
        return;
      }

      const passwordAuth = deps.authProvider as PasswordAuthProvider;
      const valid = await passwordAuth.verifyPassword(req.user!.id, result.data.currentPassword);
      if (!valid) {
        res.status(400).json({ error: 'Current password is incorrect' });
        return;
      }

      await passwordAuth.changePassword(req.user!.id, result.data.newPassword);
      res.json({ data: { message: 'Password changed successfully' } });
    } catch (err) {
      next(err);
    }
  });

  router.post('/me/avatar', auth, (req, res, next) => {
    upload.single('avatar')(req, res, async (err) => {
      if (err) {
        const status = err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        res.status(status).json({ error: err.message });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'No file provided' });
        return;
      }

      try {
        const avatarUrl = `/avatars/${req.file.filename}`;
        const user = await deps.userRepo.update(req.user!.id, { avatarUrl });
        res.json({ data: user });
      } catch (updateErr) {
        next(updateErr);
      }
    });
  });

  router.delete('/me/avatar', auth, async (req, res, next) => {
    try {
      const existing = await deps.userRepo.getById(req.user!.id);
      if (existing?.avatarUrl) {
        // Prevent path traversal — ensure resolved path stays within dataDir
        const resolvedPath = resolve(deps.dataDir, existing.avatarUrl.replace(/^\//, ''));
        const relativePath = relative(deps.dataDir, resolvedPath);
        if (!relativePath.startsWith('..') && !relativePath.includes('..')) {
          await unlink(resolvedPath).catch(() => {});
        }
      }

      const user = await deps.userRepo.update(req.user!.id, { avatarUrl: null });
      res.json({ data: user });
    } catch (err) {
      next(err);
    }
  });

  router.get('/me/reports', auth, async (req, res, next) => {
    try {
      const reports = await deps.userService.getDirectReports(req.user!.id);
      res.json({ data: reports });
    } catch (err) {
      next(err);
    }
  });

  router.get('/me/chain', auth, async (req, res, next) => {
    try {
      const chain = await deps.userService.getReportingChain(req.user!.id);
      res.json({ data: chain });
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', auth, validateId(), async (req, res, next) => {
    try {
      const canView = await deps.visibilityService.canView(req.user!.id, req.params.id);
      if (!canView) {
        res.status(403).json({ error: 'You do not have visibility to this user' });
        return;
      }

      const user = await deps.userService.getById(req.params.id);
      res.json({ data: user });
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id/objectives', auth, validateId(), async (req, res, next) => {
    try {
      const canView = await deps.visibilityService.canView(req.user!.id, req.params.id);
      if (!canView) {
        res.status(403).json({ error: 'You do not have visibility to this user' });
        return;
      }

      const cycleId = req.query.cycleId as string | undefined;
      const objectives = await deps.objectiveService.getByUserId(req.params.id, cycleId);
      res.json({ data: objectives });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
