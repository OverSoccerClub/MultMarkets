import {
    Controller, Post, Body, HttpCode, HttpStatus, Logger,
    Headers, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { PixService } from './pix.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhookController {
    private readonly logger = new Logger(WebhookController.name);
    private readonly webhookSecret: string;

    constructor(
        private pixService: PixService,
        private config: ConfigService,
    ) {
        this.webhookSecret = this.config.get<string>('BANKIZI_WEBHOOK_SECRET', '');
    }

    @Post('bankizi')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Webhook para receber notificações da Bankizi (PIX)' })
    async handleBankiziWebhook(
        @Body() body: any,
        @Headers('x-webhook-secret') headerSecret?: string,
    ) {
        // Basic webhook secret validation (if configured)
        if (this.webhookSecret && headerSecret !== this.webhookSecret) {
            this.logger.warn('Webhook rejected: invalid secret');
            throw new BadRequestException('Invalid webhook secret');
        }

        this.logger.log(`Bankizi webhook received: ${JSON.stringify(body)}`);

        const event = body?.event;
        const data = body?.data;

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
