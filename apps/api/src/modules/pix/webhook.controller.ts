import {
    Controller, Post, Get, Body, HttpCode, HttpStatus, Logger,
    Headers, BadRequestException, Query, Req, UseGuards, UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { PixService } from './pix.service';
import { SettingsService } from '../settings/settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

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

    // ── Dedicated Endpoints ───────────────────────────────────────────

    @Post('bankizi/sandbox')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Webhook para receber notificações da Bankizi (Sandbox)' })
    async handleBankiziSandboxWebhook(
        @Req() req: any,
        @Headers('x-webhook-secret') headerSecret?: string,
    ) {
        return this.processBankiziWebhook(req, headerSecret, 'SANDBOX');
    }

    @Get('bankizi/sandbox')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Test endpoint to verify Sandbox webhook URL is reachable' })
    async testBankiziSandboxWebhook() {
        this.logger.log('=== BANKIZI WEBHOOK TEST (GET SANDBOX) ===> URL is reachable!');
        return { status: 'ok', message: 'Sandbox Webhook endpoint is reachable' };
    }

    @Post('bankizi/production')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Webhook para receber notificações da Bankizi (Produção)' })
    async handleBankiziProductionWebhook(
        @Req() req: any,
        @Headers('x-webhook-secret') headerSecret?: string,
    ) {
        return this.processBankiziWebhook(req, headerSecret, 'PRODUCTION');
    }

    @Get('bankizi/production')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Test endpoint to verify Production webhook URL is reachable' })
    async testBankiziProductionWebhook() {
        this.logger.log('=== BANKIZI WEBHOOK TEST (GET PRODUCTION) ===> URL is reachable!');
        return { status: 'ok', message: 'Production Webhook endpoint is reachable' };
    }

    // ── Legacy Endpoint (Keeping for transition/fallback) ─────────────

    @Post('bankizi')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Webhook para receber notificações da Bankizi (PIX)' })
    async handleBankiziWebhook(
        @Req() req: any,
        @Headers('x-webhook-secret') headerSecret?: string,
    ) {
        // Fallback uses the active environment configured in settings
        return this.processBankiziWebhook(req, headerSecret, 'AUTO');
    }

    // ── Common Processor ──────────────────────────────────────────────

    private async processBankiziWebhook(
        req: any,
        headerSecret: string | undefined,
        environment: 'SANDBOX' | 'PRODUCTION' | 'AUTO'
    ) {
        const body = req.body;
        this.logger.log(`=== BANKIZI WEBHOOK HIT [${environment}] ===> Headers secret: ${headerSecret ? 'present' : 'missing'}`);
        this.logger.log(`=== BANKIZI WEBHOOK HEADERS ===> ${JSON.stringify(req.headers)}`);
        this.logger.log(`=== BANKIZI WEBHOOK BODY ===> ${JSON.stringify(body)}`);

        // Fetch configs and secret
        const bankiziConfig = await this.settings.getBankiziConfig();
        const activeEnv = environment === 'AUTO' ? bankiziConfig.environment : environment;
        const envPrefix = activeEnv === 'PRODUCTION' ? 'BANKIZI_PRODUCTION_' : 'BANKIZI_SANDBOX_';
        
        let webhookSecret = '';
        if (activeEnv === bankiziConfig.environment) {
            webhookSecret = bankiziConfig.webhookSecret || this.config.get<string>(`${envPrefix}WEBHOOK_SECRET`, '');
        } else {
            webhookSecret = this.config.get<string>(`${envPrefix}WEBHOOK_SECRET`, '');
        }

        // Basic webhook secret validation
        if (webhookSecret && headerSecret !== webhookSecret) {
            this.logger.warn(`Webhook REJECTED signature match [${activeEnv}]: headerSecret=${headerSecret}, expected=${webhookSecret}`);
            throw new UnauthorizedException('Invalid webhook signature');
        }

        let event = body?.event || body?.type;
        let data = body?.data || body?.payload || body;

        // Fallback for flat JSON structures {"txId": "...", "status": "APPROVED"}
        if (!event && data?.txId && data?.status) {
            this.logger.log(`Fallback: Inferring webhook event from flat structure [${activeEnv}]`);
            event = 'PIX_IN';
        }

        if (!event || !data) {
            this.logger.warn(`Webhook missing event or data [${activeEnv}]`);
            return { received: true };
        }

        try {
            await this.pixService.handleWebhook(event, data);
        } catch (error) {
            this.logger.error(`Error processing webhook [${activeEnv}]: ${error.message}`, error.stack);
            // Return 200 anyway to avoid Bankizi retrying infinitely
        }

        return { received: true };
    }

    @Get('bankizi')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Test endpoint to verify webhook URL is reachable' })
    async testBankiziWebhook() {
        this.logger.log('=== BANKIZI WEBHOOK TEST (GET) ===> URL is reachable!');
        return { 
            status: 'ok', 
            message: 'Webhook endpoint is reachable',
            timestamp: new Date().toISOString(),
        };
    }

    @Post('bankizi/simulate')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Simulate a webhook payment confirmation (for testing)' })
    async simulateBankiziWebhook(
        @Query('txId') txId: string,
    ) {
        if (!txId) {
            throw new BadRequestException('txId query param is required');
        }
        this.logger.log(`=== SIMULATING WEBHOOK for txId=${txId} ===`);
        await this.pixService.handleWebhook('PIX_IN', { txId, status: 'PAID' });
        return { status: 'ok', message: `Simulated PAID webhook for txId=${txId}` };
    }
}
