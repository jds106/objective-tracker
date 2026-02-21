import { Router } from 'express';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from '@objective-tracker/shared';
import { validate } from '../middleware/validate.middleware.js';
import { createAuthMiddleware } from '../middleware/auth.middleware.js';
import type { RouteDependencies } from './index.js';
import { PasswordAuthProvider } from '../auth/password-auth.provider.js';

export function createAuthRoutes(deps: RouteDependencies): Router {
  const router = Router();
  const auth = createAuthMiddleware(deps.authProvider);

  router.post('/register', deps.rateLimiters.register, validate(registerSchema), async (req, res, next) => {
    try {
      const { password, managerEmail, ...userData } = req.body;
      const passwordHash = await PasswordAuthProvider.hashPassword(password);

      const existing = await deps.userRepo.getByEmail(userData.email);
      if (existing) {
        res.status(409).json({ error: 'An account with this email already exists' });
        return;
      }

      // Resolve managerEmail to managerId if provided
      let managerId = userData.managerId ?? null;
      let level = userData.level;
      if (!managerId && managerEmail) {
        const manager = await deps.userRepo.getByEmail(managerEmail);
        if (manager) {
          managerId = manager.id;
          // Auto-set level to manager's level + 1 if not explicitly provided
          if (!level) {
            level = manager.level + 1;
          }
        }
        // If manager email not found, silently ignore — user can fix later
      }

      // First registered user gets admin role
      const allUsers = await deps.userRepo.getAll();
      const role = allUsers.length === 0 ? 'admin' as const : 'standard' as const;

      await deps.userRepo.create({
        email: userData.email,
        displayName: userData.displayName,
        jobTitle: userData.jobTitle,
        managerId,
        level: level ?? 5,
        department: userData.department,
        role,
        passwordHash,
      });

      const result = await deps.authProvider.authenticate({
        email: userData.email,
        password,
      });

      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  });

  router.post('/login', deps.rateLimiters.login, validate(loginSchema), async (req, res, next) => {
    try {
      const result = await deps.authProvider.authenticate(req.body);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  });

  router.post('/logout', auth, async (req, res, next) => {
    try {
      await deps.authProvider.revokeToken(req.token!);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  router.post('/forgot-password', deps.rateLimiters.passwordReset, validate(forgotPasswordSchema), async (req, res, next) => {
    try {
      const { email } = req.body;
      const resetToken = await deps.passwordResetService.requestReset(email);

      // MVP: return the token directly since there's no email service
      // In production, always return a generic message regardless of whether the email exists
      res.json({
        data: {
          message: 'If an account with that email exists, a password reset link has been sent.',
          ...(resetToken ? { resetToken } : {}),
        },
      });
    } catch (err) {
      next(err);
    }
  });

  router.post('/reset-password', deps.rateLimiters.passwordReset, validate(resetPasswordSchema), async (req, res, next) => {
    try {
      const { token, password } = req.body;
      await deps.passwordResetService.resetPassword(token, password);
      res.json({ data: { message: 'Password has been reset successfully.' } });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
