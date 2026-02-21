import { Router } from 'express';
import { createAuthMiddleware } from '../middleware/auth.middleware.js';
import type { RouteDependencies } from './index.js';

export function createAiRoutes(deps: RouteDependencies): Router {
  const router = Router();
  const auth = createAuthMiddleware(deps.authProvider);

  // All AI routes require authentication
  router.use(auth);

  // Bail out early if AI is not configured
  router.use((_req, res, next) => {
    if (!deps.aiService) {
      res.status(503).json({ error: 'AI features are not configured. Set ANTHROPIC_API_KEY to enable them.' });
      return;
    }
    next();
  });

  /** POST /api/ai/review — Review an objective for quality */
  router.post('/review', async (req, res, next) => {
    try {
      const { objectiveId } = req.body;
      if (!objectiveId || typeof objectiveId !== 'string') {
        res.status(400).json({ error: 'objectiveId is required' });
        return;
      }

      // Verify the user can view this objective
      const objective = await deps.objectiveService.getById(objectiveId);
      const canView = await deps.visibilityService.canView(req.user!.id, objective.ownerId);
      if (!canView) {
        res.status(403).json({ error: 'You do not have visibility to this objective' });
        return;
      }

      const result = await deps.aiService!.reviewObjective(objectiveId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  });

  /** POST /api/ai/suggest — Suggest child objectives for a parent */
  router.post('/suggest', async (req, res, next) => {
    try {
      const { parentObjectiveId, context } = req.body;
      if (!parentObjectiveId || typeof parentObjectiveId !== 'string') {
        res.status(400).json({ error: 'parentObjectiveId is required' });
        return;
      }

      // Verify the user can view the parent objective
      const parent = await deps.objectiveService.getById(parentObjectiveId);
      const canView = await deps.visibilityService.canView(req.user!.id, parent.ownerId);
      if (!canView) {
        res.status(403).json({ error: 'You do not have visibility to this objective' });
        return;
      }

      const result = await deps.aiService!.suggestObjectives(parentObjectiveId, context);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  });

  /** POST /api/ai/summarise — Generate a cycle review summary */
  router.post('/summarise', async (req, res, next) => {
    try {
      const { userId, cycleId } = req.body;
      if (!userId || typeof userId !== 'string') {
        res.status(400).json({ error: 'userId is required' });
        return;
      }
      if (!cycleId || typeof cycleId !== 'string') {
        res.status(400).json({ error: 'cycleId is required' });
        return;
      }

      // Verify visibility — user can only summarise themselves, their reports, or company (admin)
      if (userId !== 'company') {
        const canView = await deps.visibilityService.canView(req.user!.id, userId);
        if (!canView) {
          res.status(403).json({ error: 'You do not have visibility to this user' });
          return;
        }
      }

      const result = await deps.aiService!.summarise(userId, cycleId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
