import { logger } from '../logger.js';

export interface NotificationService {
    sendPasswordResetLink(email: string, resetToken: string): Promise<void>;
}

export class ConsoleNotificationService implements NotificationService {
    constructor(private readonly frontendUrl: string) {}

    async sendPasswordResetLink(email: string, resetToken: string): Promise<void> {
        const resetUrl = `${this.frontendUrl}/reset-password?token=${resetToken}`;
        logger.info(
            { email, resetUrl },
            `Password reset requested — use this link to reset: ${resetUrl}`,
        );
    }
}
