import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
    private readonly logger = new Logger(SmsService.name);

    constructor(private config: ConfigService) {}

    async sendVerificationSms(to: string, code: string): Promise<void> {
        // Here you would integrate with Zenvia, Twilio, AWS SNS, etc.
        // For now, we mock it.
        this.logger.warn(`[SMS_MOCK] Sending OTP ${code} to mobile phone ${to}`);
    }
}
