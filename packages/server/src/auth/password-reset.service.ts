import { randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import type { UserRepository } from '@objective-tracker/shared';
import { ValidationError } from '@objective-tracker/shared';
import type { NotificationService } from '../services/notification.service.js';
import { logger } from '../logger.js';

const DEFAULT_SALT_ROUNDS = 12;
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

interface ResetTokenEntry {
    userId: string;
    email: string;
    expiresAt: number;
}

const SWEEP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export class PasswordResetService {
    private readonly tokens = new Map<string, ResetTokenEntry>();
    private readonly saltRounds: number;
    private readonly sweepInterval: ReturnType<typeof setInterval>;

    constructor(
        private readonly userRepo: UserRepository,
        private readonly notificationService: NotificationService,
        saltRounds?: number,
    ) {
        this.saltRounds = saltRounds ?? DEFAULT_SALT_ROUNDS;

        // Periodically sweep expired tokens to prevent unbounded memory growth
        this.sweepInterval = setInterval(() => {
            const now = Date.now();
            for (const [token, entry] of this.tokens) {
                if (now > entry.expiresAt) {
                    this.tokens.delete(token);
                }
            }
        }, SWEEP_INTERVAL_MS);
    }

    /** Clear the periodic sweep interval for clean shutdown. */
    destroy(): void {
        clearInterval(this.sweepInterval);
    }

    /**
     * Request a password reset for the given email.
     * Always returns a generic message to prevent user enumeration.
     * In MVP mode, returns the token directly so it can be used without email.
     */
    async requestReset(email: string): Promise<string | null> {
        const user = await this.userRepo.getByEmail(email);
        if (!user) {
            // Don't reveal whether the email exists — log it for debugging
            logger.info({ email }, 'Password reset requested for unknown email');
            return null;
        }

        const token = randomBytes(32).toString('hex');
        this.tokens.set(token, {
            userId: user.id,
            email: user.email,
            expiresAt: Date.now() + TOKEN_EXPIRY_MS,
        });

        await this.notificationService.sendPasswordResetLink(user.email, token);

        return token;
    }

    /**
     * Reset the password using a valid token.
     * Throws ValidationError if the token is invalid or expired.
     */
    async resetPassword(token: string, newPassword: string): Promise<void> {
        const entry = this.tokens.get(token);
        if (!entry) {
            throw new ValidationError('Invalid or expired reset token');
        }

        if (Date.now() > entry.expiresAt) {
            this.tokens.delete(token);
            throw new ValidationError('Invalid or expired reset token');
        }

        const passwordHash = await bcrypt.hash(newPassword, this.saltRounds);
        await this.userRepo.updatePassword(entry.userId, passwordHash);

        // Consume the token so it can't be reused
        this.tokens.delete(token);

        logger.info({ userId: entry.userId }, 'Password reset successfully');
    }
}
