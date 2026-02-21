import { randomBytes } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
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
const PERSIST_DEBOUNCE_MS = 2_000;

export class PasswordResetService {
    private readonly tokens = new Map<string, ResetTokenEntry>();
    private readonly saltRounds: number;
    private readonly sweepInterval: ReturnType<typeof setInterval>;
    private readonly persistPath: string | null;
    private persistTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(
        private readonly userRepo: UserRepository,
        private readonly notificationService: NotificationService,
        saltRounds?: number,
        persistPath?: string,
    ) {
        this.saltRounds = saltRounds ?? DEFAULT_SALT_ROUNDS;
        this.persistPath = persistPath ?? null;

        // Periodically sweep expired tokens to prevent unbounded memory growth
        this.sweepInterval = setInterval(() => {
            const now = Date.now();
            let swept = false;
            for (const [token, entry] of this.tokens) {
                if (now > entry.expiresAt) {
                    this.tokens.delete(token);
                    swept = true;
                }
            }
            if (swept) this.schedulePersist();
        }, SWEEP_INTERVAL_MS);
    }

    /** Load previously persisted tokens from disk. Call once at startup. */
    async load(): Promise<void> {
        if (!this.persistPath) return;
        try {
            const raw = await readFile(this.persistPath, 'utf-8');
            const entries: Array<[string, ResetTokenEntry]> = JSON.parse(raw);
            const now = Date.now();
            let loaded = 0;
            for (const [token, entry] of entries) {
                if (now <= entry.expiresAt) {
                    this.tokens.set(token, entry);
                    loaded++;
                }
            }
            logger.info({ loaded, expired: entries.length - loaded }, 'Password reset tokens loaded from disk');
        } catch {
            // File doesn't exist yet — that's fine
        }
    }

    /** Clear the periodic sweep interval for clean shutdown. */
    destroy(): void {
        clearInterval(this.sweepInterval);
        if (this.persistTimer) {
            clearTimeout(this.persistTimer);
            this.persistTimer = null;
        }
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

        this.schedulePersist();

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
            this.schedulePersist();
            throw new ValidationError('Invalid or expired reset token');
        }

        const passwordHash = await bcrypt.hash(newPassword, this.saltRounds);
        await this.userRepo.updatePassword(entry.userId, passwordHash);

        // Consume the token so it can't be reused
        this.tokens.delete(token);
        this.schedulePersist();

        logger.info({ userId: entry.userId }, 'Password reset successfully');
    }

    /** Debounced write to disk. */
    private schedulePersist(): void {
        if (!this.persistPath) return;
        if (this.persistTimer) clearTimeout(this.persistTimer);
        this.persistTimer = setTimeout(() => {
            void this.persist();
        }, PERSIST_DEBOUNCE_MS);
    }

    /** Write current tokens to disk. */
    private async persist(): Promise<void> {
        if (!this.persistPath) return;
        try {
            await mkdir(dirname(this.persistPath), { recursive: true });
            const entries = [...this.tokens.entries()];
            await writeFile(this.persistPath, JSON.stringify(entries), 'utf-8');
        } catch (err) {
            logger.error({ err }, 'Failed to persist password reset tokens');
        }
    }

    /** Flush pending writes immediately. Call on shutdown. */
    async flush(): Promise<void> {
        if (this.persistTimer) {
            clearTimeout(this.persistTimer);
            this.persistTimer = null;
        }
        await this.persist();
    }
}
