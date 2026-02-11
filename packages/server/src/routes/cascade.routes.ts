import { Router } from 'express';
import { createAuthMiddleware } from '../middleware/auth.middleware.js';
import type { RouteDependencies } from './index.js';

export function createCascadeRoutes(deps: RouteDependencies): Router {
  const router = Router();
  const auth = createAuthMiddleware(deps.authProvider);

  router.get('/tree', auth, async (req, res, next) => {
    try {
      const cycleId = req.query.cycleId as string | undefined;
      const tree = await deps.cascadeService.getTree(req.user!.id, cycleId);
      res.json({ data: tree });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
