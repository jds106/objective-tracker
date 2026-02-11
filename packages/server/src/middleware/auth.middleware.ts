import type { Request, Response, NextFunction } from 'express';
import type { AuthProvider, User } from '@objective-tracker/shared';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      token?: string;
    }
  }
}

export function createAuthMiddleware(authProvider: AuthProvider) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const token = header.slice(7);
    try {
      const user = await authProvider.validateToken(token);
      if (!user) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
      }

      req.user = user;
      req.token = token;
      next();
    } catch {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}
