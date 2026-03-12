import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
// import { UsersModule } from './modules/users/users.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { MarketsModule } from './modules/markets/markets.module';
import { TradingModule } from './modules/trading/trading.module';
import { BotModule } from './modules/bot/bot.module';
import { PixModule } from './modules/pix/pix.module';
import { GatewaysModule } from './modules/gateways/gateways.module';
import { SettingsModule } from './modules/settings/settings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FinancialModule } from './modules/financial/financial.module';
// import { NotificationsModule } from './modules/notifications/notifications.module';
// import { AdminModule } from './modules/admin/admin.module';
// import { CategoriesModule } from './modules/categories/categories.module';

@Module({
    imports: [
        // ── Config ────────────────────────────────────────────────────
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env', '../../.env'],
        }),

        // ── Rate Limiting ─────────────────────────────────────────────
        ThrottlerModule.forRoot([
            { name: 'short', ttl: 60000, limit: 60 },    // 60 req/min
            { name: 'long', ttl: 3600000, limit: 1000 }, // 1000 req/hr
        ]),

        // ── Scheduling (cron jobs) ────────────────────────────────────
        ScheduleModule.forRoot(),

        // ── Events ────────────────────────────────────────────────────
        EventEmitterModule.forRoot(),

        // ── Redis Queues ──────────────────────────────────────────────
        BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                redis: {
                    host: config.get('REDIS_HOST', 'localhost'),
                    port: config.get<number>('REDIS_PORT', 6379),
                    password: config.get('REDIS_PASSWORD'),
                },
            }),
        }),

        // ── Feature Modules ───────────────────────────────────────────
        PrismaModule,
        AuthModule,
        WalletModule,
        MarketsModule,
        TradingModule,
        BotModule,
        PixModule,
        GatewaysModule,
        SettingsModule,
        NotificationsModule,
        FinancialModule,
    ],
})
export class AppModule { }
