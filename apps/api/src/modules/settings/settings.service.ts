import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SettingsService implements OnModuleInit {
    private readonly logger = new Logger(SettingsService.name);

    constructor(private prisma: PrismaService) {}

    async onModuleInit() {
        await this.seedDefaults();
    }

    private async seedDefaults() {
        const defaults = [
            {
                key: 'PLATFORM_TRADE_FEE',
                value: '0.02',
                description: 'Taxa base cobrada em cada operação de compra/venda (0.02 = 2%)',
            },
        ];

        for (const item of defaults) {
            const existing = await this.prisma.systemConfig.findUnique({ where: { key: item.key } });
            if (!existing) {
                this.logger.log(`Seeding default setting: ${item.key}`);
                await this.prisma.systemConfig.create({ data: item });
            }
        }
    }

    async getAllSettings() {
        return this.prisma.systemConfig.findMany({
            orderBy: { key: 'asc' },
        });
    }

    async getSetting(key: string): Promise<string | null> {
        const setting = await this.prisma.systemConfig.findUnique({
            where: { key },
        });
        return setting?.value || null;
    }

    async upsertSetting(key: string, value: string, description?: string, isSecret: boolean = false) {
        this.logger.log(`Updating setting: ${key}`);
        
        // If it's a secret and the new value is masked (e.g. '****...'), don't overwrite if it hasn't actually changed.
        // We'll assume the frontend will send the actual new value or we just protect against saving masked values verbatim.
        if (isSecret && value.includes('••••')) {
            return this.prisma.systemConfig.findUniqueOrThrow({ where: { key } });
        }

        return this.prisma.systemConfig.upsert({
            where: { key },
            update: {
                value,
                ...(description ? { description } : {}),
                isSecret,
            },
            create: {
                key,
                value,
                description,
                isSecret,
            },
        });
    }

    async getBankiziConfig() {
        // Retrieve the master environment toggle
        const environment = await this.getSetting('BANKIZI_ENVIRONMENT') || 'SANDBOX';
        const prefix = environment === 'PRODUCTION' ? 'BANKIZI_PRODUCTION_' : 'BANKIZI_SANDBOX_';

        const baseUrl = await this.getSetting(`${prefix}BASE_URL`);
        const clientId = await this.getSetting(`${prefix}CLIENT_ID`);
        const clientSecret = await this.getSetting(`${prefix}CLIENT_SECRET`);
        const accountId = await this.getSetting(`${prefix}ACCOUNT_ID`);
        const webhookSecret = await this.getSetting(`${prefix}WEBHOOK_SECRET`);

        return { baseUrl, clientId, clientSecret, accountId, webhookSecret, environment };
    }
}
