import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SessionCleanupService {
    private readonly logger = new Logger(SessionCleanupService.name);

    constructor(private prisma: PrismaService) { }

    @Cron(CronExpression.EVERY_HOUR)
    async handleCleanup() {
        this.logger.log('Running session cleanup...');
        
        const now = new Date();
        
        try {
            // Cleanup expired sessions
            const sessionResult = await this.prisma.userSession.deleteMany({
                where: { expiresAt: { lt: now } },
            });
            
            // Cleanup expired email tokens (reset password, verify email)
            const tokenResult = await this.prisma.emailToken.deleteMany({
                where: { expiresAt: { lt: now } },
            });

            // Cleanup expired OTP verification codes
            const codeResult = await this.prisma.verificationCode.deleteMany({
                where: { expiresAt: { lt: now } },
            });

            if (sessionResult.count > 0 || tokenResult.count > 0 || codeResult.count > 0) {
                this.logger.log(`Cleanup complete: ${sessionResult.count} sessions, ${tokenResult.count} tokens, ${codeResult.count} codes removed.`);
            }
        } catch (error) {
            this.logger.error('Failed to run session cleanup:', error.stack);
        }
    }
}
