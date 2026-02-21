import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '@objective-tracker/shared';
import { logger } from '../logger.js';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Catch ZodError that may bypass validate middleware (e.g. manual schema parsing in routes)
  if (err instanceof ZodError) {
    const messages = err.errors.map(e => `${e.path.join('.')}: ${e.message}`);
    res.status(400).json({ error: 'Validation failed', details: messages });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
}
