import { Router } from 'express';
import { createAuthMiddleware } from '../middleware/auth.middleware.js';
import type { RouteDependencies } from './index.js';

export function createUserRoutes(deps: RouteDependencies): Router {
  const router = Router();
  const auth = createAuthMiddleware(deps.authProvider);

  router.get('/me', auth, async (req, res, next) => {
    try {
      const user = await deps.userService.getById(req.user!.id);
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

  router.get('/:id', auth, async (req, res, next) => {
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

  router.get('/:id/objectives', auth, async (req, res, next) => {
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
