import { z } from 'zod';

const configSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATA_DIR: z.string().default('./data'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRY: z.string().default('24h'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(16).default(12),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  return configSchema.parse(process.env);
}
