import { join } from 'node:path';
import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import type { Config } from './config.js';
import { createRateLimiters } from './middleware/rate-limit.middleware.js';
import {
  JsonUserRepository,
  JsonObjectiveRepository,
  JsonKeyResultRepository,
  JsonCycleRepository,
} from './repositories/index.js';
import { JwtService, TokenBlacklist, PasswordAuthProvider, PasswordResetService } from './auth/index.js';
import {
  VisibilityService,
  UserService,
  ObjectiveService,
  KeyResultService,
  CheckInService,
  CycleService,
  CascadeService,
} from './services/index.js';
import { ConsoleNotificationService } from './services/index.js';
import { createRoutes } from './routes/index.js';
import { errorHandler } from './middleware/error-handler.middleware.js';
import { logger } from './logger.js';

export async function createApp(config: Config): Promise<Express> {
  const app = express();

  // ── Security middleware ──────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        scriptSrc: ["'self'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
  app.use(cors({
    origin: config.FRONTEND_URL,
    credentials: true,
  }));

  // ── Request logging ──────────────────────────────────────────
  app.use(pinoHttp({ logger }));

  // ── Body parsing ─────────────────────────────────────────────
  app.use(express.json());
  app.use('/avatars', express.static(join(config.DATA_DIR, 'avatars')));

  // ── Rate limiting ────────────────────────────────────────────
  const rateLimiters = createRateLimiters();

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
  const authProvider = new PasswordAuthProvider(userRepo, jwtService, tokenBlacklist, config.BCRYPT_SALT_ROUNDS);

  // Initialise services
  const visibilityService = new VisibilityService(userRepo);
  const userService = new UserService(userRepo);
  const objectiveService = new ObjectiveService(objectiveRepo, cycleRepo);
  const keyResultService = new KeyResultService(keyResultRepo, objectiveRepo);
  const checkInService = new CheckInService(keyResultRepo);
  const cycleService = new CycleService(cycleRepo);
  const cascadeService = new CascadeService(userRepo, objectiveRepo, visibilityService);
  const notificationService = new ConsoleNotificationService(config.FRONTEND_URL);
  const passwordResetService = new PasswordResetService(userRepo, notificationService, config.BCRYPT_SALT_ROUNDS);

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
    cascadeService,
    passwordResetService,
    rateLimiters,
    dataDir: config.DATA_DIR,
    saltRounds: config.BCRYPT_SALT_ROUNDS,
  });

  app.use('/api', routes);
  app.use(errorHandler);

  return app;
}
