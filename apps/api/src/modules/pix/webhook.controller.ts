import {
    Controller, Post, Body, HttpCode, HttpStatus, Logger,
    Headers, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { PixService } from './pix.service';
import { SettingsService } from '../settings/settings.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhookController {
    private readonly logger = new Logger(WebhookController.name);
    private readonly webhookSecret: string;

    constructor(
        private pixService: PixService,
        private config: ConfigService,
        private settings: SettingsService,
    ) {
    }

    @Post('bankizi')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Webhook para receber notificações da Bankizi (PIX)' })
    async handleBankiziWebhook(
        @Body() body: any,
        @Headers('x-webhook-secret') headerSecret?: string,
    ) {
        // Fetch webhook secret dynamically from DB based on active environment (Sandbox vs Prod)
        const bankiziConfig = await this.settings.getBankiziConfig();
        const envPrefix = bankiziConfig.environment === 'PRODUCTION' ? 'BANKIZI_PRODUCTION_' : 'BANKIZI_SANDBOX_';
        const webhookSecret = bankiziConfig.webhookSecret || this.config.get<string>(`${envPrefix}WEBHOOK_SECRET`, '');

        // Basic webhook secret validation (if configured)
        if (webhookSecret && headerSecret !== webhookSecret) {
            this.logger.warn('Webhook rejected: invalid secret');
            throw new BadRequestException('Invalid webhook secret');
        }

        this.logger.log(`Bankizi webhook received: ${JSON.stringify(body)}`);

        let event = body?.event || body?.type;
        let data = body?.data || body?.payload || body;

        // Fallback for flat JSON structures {"txId": "...", "status": "APPROVED"}
        if (!event && data?.txId && data?.status) {
            this.logger.log('Fallback: Inferring webhook event from flat structure');
            event = 'PIX_IN';
        }

        if (!event || !data) {
            this.logger.warn('Webhook missing event or data');
            return { received: true };
        }

        try {
            await this.pixService.handleWebhook(event, data);
        } catch (error) {
            this.logger.error(`Error processing webhook: ${error.message}`, error.stack);
            // Return 200 anyway to avoid Bankizi retrying
        }

        return { received: true };
    }
}
