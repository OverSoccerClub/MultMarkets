import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor(config: ConfigService) {
        super({
            datasources: {
                db: {
                    url: config.get('DATABASE_URL'),
                },
            },
            log: config.get('NODE_ENV') === 'development' ? ['query', 'error', 'warn'] : ['error'],
        });
    }

    async onModuleInit() {
        await this.$connect();
        this.logger.log('✅ Database connected');
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }

    // Helper: clean/reset for tests
    async cleanDatabase() {
        if (process.env.NODE_ENV !== 'test') return;
        const models = Reflect.ownKeys(this).filter((k) => typeof k === 'string' && k[0] !== '_') as string[];
        return Promise.all(models.map((model) => (this as any)[model]?.deleteMany?.()));
    }
}
