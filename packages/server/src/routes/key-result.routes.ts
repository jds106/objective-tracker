import { Router } from 'express';
import {
  createKeyResultSchema,
  updateKeyResultSchema,
  checkInSchema,
} from '@objective-tracker/shared';
import { createAuthMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { validateId } from '../middleware/validate-id.middleware.js';
import type { RouteDependencies } from './index.js';

export function createKeyResultRoutes(deps: RouteDependencies): Router {
  const router = Router();
  const auth = createAuthMiddleware(deps.authProvider);

  // POST /api/objectives/:objectiveId/key-results
  router.post('/objectives/:objectiveId/key-results', auth, validateId('objectiveId'), validate(createKeyResultSchema), async (req, res, next) => {
    try {
      const objective = await deps.objectiveService.getById(req.params.objectiveId);
      const canEdit = await deps.visibilityService.canEdit(req.user!.id, objective.ownerId);
      if (!canEdit) {
        res.status(403).json({ error: 'You do not have permission to add key results to this objective' });
        return;
      }
      if (objective.status !== 'draft') {
        res.status(403).json({ error: 'Key results can only be added to objectives in draft status. Revert the objective to draft first.' });
        return;
      }

      const kr = await deps.keyResultService.create(req.params.objectiveId, req.body);
      res.status(201).json({ data: kr });
    } catch (err) {
      next(err);
    }
  });

  // PUT /api/key-results/:id
  router.put('/key-results/:id', auth, validateId(), validate(updateKeyResultSchema), async (req, res, next) => {
    try {
      const kr = await deps.keyResultService.getById(req.params.id);
      const objective = await deps.objectiveService.getById(kr.objectiveId);
      const canEdit = await deps.visibilityService.canEdit(req.user!.id, objective.ownerId);
      if (!canEdit) {
        res.status(403).json({ error: 'You do not have permission to edit this key result' });
        return;
      }
      if (objective.status !== 'draft') {
        res.status(403).json({ error: 'Key results can only be edited when the objective is in draft status. Revert the objective to draft first.' });
        return;
      }

      const updated = await deps.keyResultService.update(req.params.id, req.body);
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  });

  // DELETE /api/key-results/:id
  router.delete('/key-results/:id', auth, validateId(), async (req, res, next) => {
    try {
      const kr = await deps.keyResultService.getById(req.params.id);
      const objective = await deps.objectiveService.getById(kr.objectiveId);
      const canEdit = await deps.visibilityService.canEdit(req.user!.id, objective.ownerId);
      if (!canEdit) {
        res.status(403).json({ error: 'You do not have permission to delete this key result' });
        return;
      }
      if (objective.status !== 'draft') {
        res.status(403).json({ error: 'Key results can only be deleted when the objective is in draft status. Revert the objective to draft first.' });
        return;
      }

      await deps.keyResultService.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  // POST /api/key-results/:id/check-in
  router.post('/key-results/:id/check-in', auth, validateId(), validate(checkInSchema), async (req, res, next) => {
    try {
      const kr = await deps.keyResultService.getById(req.params.id);
      const objective = await deps.objectiveService.getById(kr.objectiveId);
      const canEdit = await deps.visibilityService.canEdit(req.user!.id, objective.ownerId);
      if (!canEdit) {
        res.status(403).json({ error: 'You do not have permission to check in on this key result' });
        return;
      }

      const checkIn = await deps.checkInService.recordCheckIn(req.params.id, req.user!.id, req.body);
      res.status(201).json({ data: checkIn });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
