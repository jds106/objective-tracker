import rateLimit from 'express-rate-limit';

export interface RateLimiters {
  /** Login: 10 attempts per 15-minute window */
  login: ReturnType<typeof rateLimit>;
  /** Registration: 5 attempts per hour */
  register: ReturnType<typeof rateLimit>;
  /** Password reset requests: 3 per hour */
  passwordReset: ReturnType<typeof rateLimit>;
}

export function createRateLimiters(): RateLimiters {
  return {
    login: rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 10,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { error: 'Too many login attempts. Please try again later.' },
    }),

    register: rateLimit({
      windowMs: 60 * 60 * 1000,
      limit: 5,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { error: 'Too many registration attempts. Please try again later.' },
    }),

    passwordReset: rateLimit({
      windowMs: 60 * 60 * 1000,
      limit: 3,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { error: 'Too many password reset requests. Please try again later.' },
    }),
  };
}
