import { Router } from 'express';
import type { AuthProvider, UserRepository } from '@objective-tracker/shared';
import type { PasswordResetService } from '../auth/password-reset.service.js';
import type { VisibilityService } from '../services/visibility.service.js';
import type { UserService } from '../services/user.service.js';
import type { ObjectiveService } from '../services/objective.service.js';
import type { KeyResultService } from '../services/key-result.service.js';
import type { CheckInService } from '../services/check-in.service.js';
import type { CycleService } from '../services/cycle.service.js';
import type { CascadeService } from '../services/cascade.service.js';
import type { RateLimiters } from '../middleware/rate-limit.middleware.js';
import { createAuthRoutes } from './auth.routes.js';
import { createUserRoutes } from './user.routes.js';
import { createObjectiveRoutes } from './objective.routes.js';
import { createKeyResultRoutes } from './key-result.routes.js';
import { createCycleRoutes } from './cycle.routes.js';
import { createCascadeRoutes } from './cascade.routes.js';
import { createAdminRoutes } from './admin.routes.js';

export interface RouteDependencies {
  authProvider: AuthProvider;
  userRepo: UserRepository;
  visibilityService: VisibilityService;
  userService: UserService;
  objectiveService: ObjectiveService;
  keyResultService: KeyResultService;
  checkInService: CheckInService;
  cycleService: CycleService;
  cascadeService: CascadeService;
  passwordResetService: PasswordResetService;
  rateLimiters: RateLimiters;
  dataDir: string;
  saltRounds: number;
}

export function createRoutes(deps: RouteDependencies): Router {
  const router = Router();

  router.use('/auth', createAuthRoutes(deps));
  router.use('/users', createUserRoutes(deps));
  router.use('/objectives', createObjectiveRoutes(deps));
  router.use('/', createKeyResultRoutes(deps));
  router.use('/cycles', createCycleRoutes(deps));
  router.use('/cascade', createCascadeRoutes(deps));
  router.use('/admin', createAdminRoutes(deps));

  return router;
}
