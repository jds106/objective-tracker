import { Router } from 'express';
import type { AuthProvider, UserRepository } from '@objective-tracker/shared';
import type { VisibilityService } from '../services/visibility.service.js';
import type { UserService } from '../services/user.service.js';
import type { ObjectiveService } from '../services/objective.service.js';
import type { KeyResultService } from '../services/key-result.service.js';
import type { CheckInService } from '../services/check-in.service.js';
import type { CycleService } from '../services/cycle.service.js';
import { createAuthRoutes } from './auth.routes.js';
import { createUserRoutes } from './user.routes.js';
import { createObjectiveRoutes } from './objective.routes.js';
import { createKeyResultRoutes } from './key-result.routes.js';
import { createCycleRoutes } from './cycle.routes.js';

export interface RouteDependencies {
  authProvider: AuthProvider;
  userRepo: UserRepository;
  visibilityService: VisibilityService;
  userService: UserService;
  objectiveService: ObjectiveService;
  keyResultService: KeyResultService;
  checkInService: CheckInService;
  cycleService: CycleService;
}

export function createRoutes(deps: RouteDependencies): Router {
  const router = Router();

  router.use('/auth', createAuthRoutes(deps));
  router.use('/users', createUserRoutes(deps));
  router.use('/objectives', createObjectiveRoutes(deps));
  router.use('/', createKeyResultRoutes(deps));
  router.use('/cycles', createCycleRoutes(deps));

  return router;
}
