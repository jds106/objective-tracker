import { Router } from 'express';
import { createAuthMiddleware } from '../middleware/auth.middleware.js';
import type { RouteDependencies } from './index.js';

export function createCycleRoutes(deps: RouteDependencies): Router {
  const router = Router();
  const auth = createAuthMiddleware(deps.authProvider);

  router.get('/', auth, async (req, res, next) => {
    try {
      const cycles = await deps.cycleService.getAll();
      res.json({ data: cycles });
    } catch (err) {
      next(err);
    }
  });

  router.get('/active', auth, async (req, res, next) => {
    try {
      const cycle = await deps.cycleService.getActive();
      res.json({ data: cycle });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
