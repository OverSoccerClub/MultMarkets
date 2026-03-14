import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { createHash } from 'crypto';

export interface JwtPayload {
    sub: string; // userId
    email: string;
    role: string;
    sessionId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        private config: ConfigService,
        private prisma: PrismaService,
    ) {
        const secret = config?.get<string>('JWT_SECRET') || process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET is required');
        }

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
        });
    }

    async validate(payload: JwtPayload) {
        if (payload.sessionId) {
            const sessionHash = createHash('sha256').update(payload.sessionId).digest('hex');
            const session = await this.prisma.userSession.findFirst({
                where: { tokenHash: sessionHash, expiresAt: { gt: new Date() } },
            });
            if (!session) {
                throw new UnauthorizedException('Sessão expirada ou revogada');
            }
        }

        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: {
                id: true, email: true, role: true,
                isActive: true, isBanned: true, emailVerified: true,
                twoFactorEnabled: true,
                cpf: true,
            },
        });

        if (!user || !user.isActive || user.isBanned) {
            throw new UnauthorizedException('Sessão inválida');
        }

        return { ...user, sessionId: payload.sessionId };
    }
}
