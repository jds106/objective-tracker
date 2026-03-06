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
  AiService,
} from './services/index.js';
import { ConsoleNotificationService } from './services/index.js';
import { AnthropicLlmClient, OllamaLlmClient } from './services/llm-client.js';
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
  const allowedOrigins = config.ALLOWED_ORIGINS
    ? config.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
    : [config.FRONTEND_URL];
  app.use(cors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
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

  // Initialise auth (with file-based token persistence)
  const jwtService = new JwtService(config);
  const tokenBlacklist = new TokenBlacklist(join(config.DATA_DIR, 'token-blacklist.json'));
  await tokenBlacklist.load();
  const authProvider = new PasswordAuthProvider(userRepo, jwtService, tokenBlacklist, config.BCRYPT_SALT_ROUNDS);

  // Initialise services
  const visibilityService = new VisibilityService(userRepo);
  const userService = new UserService(userRepo);
  const objectiveService = new ObjectiveService(objectiveRepo, cycleRepo, keyResultRepo);
  const keyResultService = new KeyResultService(keyResultRepo, objectiveRepo);
  const checkInService = new CheckInService(keyResultRepo);
  const cycleService = new CycleService(cycleRepo);
  const cascadeService = new CascadeService(userRepo, objectiveRepo, visibilityService);
  const notificationService = new ConsoleNotificationService(config.FRONTEND_URL);
  const passwordResetService = new PasswordResetService(
    userRepo, notificationService, config.BCRYPT_SALT_ROUNDS,
    join(config.DATA_DIR, 'reset-tokens.json'),
  );
  await passwordResetService.load();

  // Initialise AI service (optional)
  let aiService: AiService | null = null;

  if (config.AI_PROVIDER === 'ollama') {
    const llmClient = new OllamaLlmClient(config.OLLAMA_BASE_URL, config.OLLAMA_MODEL);
    aiService = new AiService(llmClient, objectiveRepo, userRepo);
    logger.info({ provider: 'ollama', model: config.OLLAMA_MODEL, baseUrl: config.OLLAMA_BASE_URL }, 'AI features enabled (Ollama)');
  } else if (config.ANTHROPIC_API_KEY) {
    const llmClient = new AnthropicLlmClient(config.ANTHROPIC_API_KEY, config.ANTHROPIC_MODEL);
    aiService = new AiService(llmClient, objectiveRepo, userRepo);
    logger.info({ provider: 'anthropic', model: config.ANTHROPIC_MODEL }, 'AI features enabled (Anthropic)');
  } else {
    logger.info('AI features disabled (no ANTHROPIC_API_KEY set and AI_PROVIDER is not ollama)');
  }

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
    aiService,
    rateLimiters,
    dataDir: config.DATA_DIR,
    saltRounds: config.BCRYPT_SALT_ROUNDS,
  });

  app.use('/api', routes);
  app.use(errorHandler);

  return app;
}
