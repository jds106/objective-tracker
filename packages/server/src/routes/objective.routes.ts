import { Router } from 'express';
import { createObjectiveSchema, updateObjectiveSchema } from '@objective-tracker/shared';
import { createAuthMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { validateId } from '../middleware/validate-id.middleware.js';
import type { RouteDependencies } from './index.js';

export function createObjectiveRoutes(deps: RouteDependencies): Router {
  const router = Router();
  const auth = createAuthMiddleware(deps.authProvider);

  router.get('/', auth, async (req, res, next) => {
    try {
      const cycleId = req.query.cycleId as string | undefined;
      const objectives = await deps.objectiveService.getByUserId(req.user!.id, cycleId);
      res.json({ data: objectives });
    } catch (err) {
      next(err);
    }
  });

  /** Company-level objectives — visible to all authenticated users */
  router.get('/company', auth, async (req, res, next) => {
    try {
      const cycleId = req.query.cycleId as string | undefined;
      const objectives = await deps.objectiveService.getByUserId('company', cycleId);
      res.json({ data: objectives });
    } catch (err) {
      if ((err as { name?: string }).name === 'NotFoundError') {
        res.json({ data: [] });
        return;
      }
      next(err);
    }
  });

  router.post('/', auth, validate(createObjectiveSchema), async (req, res, next) => {
    try {
      const objective = await deps.objectiveService.create(req.user!.id, req.body);
      res.status(201).json({ data: objective });
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', auth, validateId(), async (req, res, next) => {
    try {
      const objective = await deps.objectiveService.getById(req.params.id);
      const canView = await deps.visibilityService.canView(req.user!.id, objective.ownerId);
      if (!canView) {
        res.status(403).json({ error: 'You do not have visibility to this objective' });
        return;
      }
      const canEdit = await deps.visibilityService.canEdit(req.user!.id, objective.ownerId);
      res.json({ data: objective, canEdit });
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', auth, validateId(), validate(updateObjectiveSchema), async (req, res, next) => {
    try {
      const objective = await deps.objectiveService.getById(req.params.id);
      const canEdit = await deps.visibilityService.canEdit(req.user!.id, objective.ownerId);
      if (!canEdit) {
        res.status(403).json({ error: 'You do not have permission to edit this objective' });
        return;
      }
      const updated = await deps.objectiveService.update(req.params.id, req.body);
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', auth, validateId(), async (req, res, next) => {
    try {
      const objective = await deps.objectiveService.getById(req.params.id);
      const canEdit = await deps.visibilityService.canEdit(req.user!.id, objective.ownerId);
      if (!canEdit) {
        res.status(403).json({ error: 'You do not have permission to delete this objective' });
        return;
      }
      await deps.objectiveService.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  /** Roll forward an objective to a new cycle */
  router.post('/:id/rollforward', auth, validateId(), async (req, res, next) => {
    try {
      const objective = await deps.objectiveService.getById(req.params.id);
      const canEdit = await deps.visibilityService.canEdit(req.user!.id, objective.ownerId);
      if (!canEdit) {
        res.status(403).json({ error: 'You do not have permission to roll forward this objective' });
        return;
      }

      const { targetCycleId } = req.body;
      if (!targetCycleId || typeof targetCycleId !== 'string') {
        res.status(400).json({ error: 'targetCycleId is required' });
        return;
      }

      const newObjective = await deps.objectiveService.rollforward(req.params.id, targetCycleId);
      res.status(201).json({ data: newObjective });
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id/cascade', auth, validateId(), async (req, res, next) => {
    try {
      const path = await deps.cascadeService.getCascadePath(req.params.id, req.user!.id);
      res.json({ data: path });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
