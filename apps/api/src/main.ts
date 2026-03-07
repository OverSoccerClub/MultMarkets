import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
    const logger = new Logger('Bootstrap');
    const app = await NestFactory.create(AppModule);

    const config = app.get(ConfigService);
    const port = config.get<number>('PORT', 3000);
    const clientUrl = config.get<string>('CLIENT_URL', 'http://localhost:3000');

    // ── Global pipes ──────────────────────────────────────────────────
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: { enableImplicitConversion: true },
        }),
    );

    // ── CORS ──────────────────────────────────────────────────────────
    const allowedOrigins = [
        clientUrl,
        'http://localhost:3000',
        'http://localhost:19006',
        'https://www.multmarkets.com',
        'https://multmarkets.com',
        'https://mult-markets-plataforma-web.ptehea.easypanel.host'
    ];

    app.enableCors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('localhost')) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    });

    // ── Global prefix ─────────────────────────────────────────────────
    app.setGlobalPrefix('api/v1');

    // ── Swagger ───────────────────────────────────────────────────────
    if (config.get('NODE_ENV') !== 'production') {
        const swaggerConfig = new DocumentBuilder()
            .setTitle('MultMarkets API')
            .setDescription('Prediction Market Platform REST API')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = SwaggerModule.createDocument(app, swaggerConfig);
        SwaggerModule.setup('api/docs', app, document);
        logger.log(`📚 Swagger: http://localhost:${port}/api/docs`);
    }

    await app.listen(port, '0.0.0.0');
    logger.log(`🚀 API running on http://0.0.0.0:${port}`);
}

bootstrap();
