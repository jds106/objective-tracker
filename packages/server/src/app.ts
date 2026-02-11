import express, { type Express } from 'express';
import cors from 'cors';
import type { Config } from './config.js';
import {
  JsonUserRepository,
  JsonObjectiveRepository,
  JsonKeyResultRepository,
  JsonCycleRepository,
} from './repositories/index.js';
import { JwtService, TokenBlacklist, PasswordAuthProvider } from './auth/index.js';
import {
  VisibilityService,
  UserService,
  ObjectiveService,
  KeyResultService,
  CheckInService,
  CycleService,
} from './services/index.js';
import { createRoutes } from './routes/index.js';
import { errorHandler } from './middleware/error-handler.middleware.js';

export async function createApp(config: Config): Promise<Express> {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Initialise repositories
  const userRepo = new JsonUserRepository(config.DATA_DIR);
  const objectiveRepo = new JsonObjectiveRepository(config.DATA_DIR, userRepo);
  const keyResultRepo = new JsonKeyResultRepository(config.DATA_DIR, userRepo);
  const cycleRepo = new JsonCycleRepository(config.DATA_DIR);

  await userRepo.init();
  await objectiveRepo.init();
  await keyResultRepo.init();
  await cycleRepo.init();

  // Initialise auth
  const jwtService = new JwtService(config);
  const tokenBlacklist = new TokenBlacklist();
  const authProvider = new PasswordAuthProvider(userRepo, jwtService, tokenBlacklist);

  // Initialise services
  const visibilityService = new VisibilityService(userRepo);
  const userService = new UserService(userRepo);
  const objectiveService = new ObjectiveService(objectiveRepo, cycleRepo);
  const keyResultService = new KeyResultService(keyResultRepo, objectiveRepo);
  const checkInService = new CheckInService(keyResultRepo);
  const cycleService = new CycleService(cycleRepo);

  // Mount routes
  const routes = createRoutes({
    authProvider,
    userRepo,
    visibilityService,
    userService,
    objectiveService,
    keyResultService,
    checkInService,
    cycleService,
  });

  app.use('/api', routes);
  app.use(errorHandler);

  return app;
}
