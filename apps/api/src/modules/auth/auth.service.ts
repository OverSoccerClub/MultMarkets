import {
    Injectable, BadRequestException, UnauthorizedException,
    ConflictException, NotFoundException, Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { randomUUID as uuid } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { EmailService } from '../email/email.service';
import { JWT } from '@multmarkets/shared';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private readonly BCRYPT_ROUNDS = 12;

    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private config: ConfigService,
        private emailService: EmailService,
    ) { }

    // ── REGISTER ─────────────────────────────────────────────────────
    async register(dto: RegisterDto) {
        // Check uniqueness
        const existing = await this.prisma.user.findFirst({
            where: { OR: [{ email: dto.email }, { username: dto.username }] },
        });
        if (existing?.email === dto.email) throw new ConflictException('E-mail já cadastrado');
        if (existing?.username === dto.username) throw new ConflictException('Username já em uso');

        const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);

        const user = await this.prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    name: dto.name,
                    username: dto.username.toLowerCase(),
                    email: dto.email.toLowerCase(),
                    passwordHash,
                },
            });

            // Create wallet on registration (skip for ADMINs)
            if (newUser.role !== 'ADMIN') {
                await tx.wallet.create({
                    data: { userId: newUser.id },
                });
            }

            // Create email verification token
            const token = this.generateSecureToken();
            await tx.emailToken.create({
                data: {
                    userId: newUser.id,
                    token,
                    type: 'email_verify',
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                },
            });

            return { user: newUser, verifyToken: token };
        });

        this.logger.log(`New user registered: ${user.user.email}`);

        // If SMTP is configured, send the verification email
        // Otherwise, auto-verify so the user isn't locked out
        if (this.emailService.isSmtpConfigured) {
            try {
                await this.emailService.sendVerificationEmail(
                    user.user.email,
                    user.user.name,
                    user.verifyToken,
                );
            } catch (err) {
                this.logger.error(`Failed to send verification email: ${err.message}`);
            }
            return { message: 'Conta criada! Verifique seu e-mail.', userId: user.user.id };
        } else {
            // Auto-verify in development / when SMTP is not configured
            await this.prisma.user.update({
                where: { id: user.user.id },
                data: { emailVerified: true },
            });
            this.logger.warn(`SMTP not configured — auto-verified email for ${user.user.email}`);
            return { message: 'Conta criada com sucesso!', userId: user.user.id };
        }
    }

    // ── VERIFY EMAIL ─────────────────────────────────────────────────
    async verifyEmail(token: string) {
        const emailToken = await this.prisma.emailToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!emailToken || emailToken.type !== 'email_verify') {
            throw new BadRequestException('Token inválido');
        }
        if (emailToken.usedAt) throw new BadRequestException('Token já utilizado');
        if (emailToken.expiresAt < new Date()) throw new BadRequestException('Token expirado');

        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: emailToken.userId },
                data: { emailVerified: true },
            }),
            this.prisma.emailToken.update({
                where: { id: emailToken.id },
                data: { usedAt: new Date() },
            }),
        ]);

        return { message: 'E-mail verificado com sucesso!' };
    }

    // ── LOGIN ─────────────────────────────────────────────────────────
    async login(dto: LoginDto, ipAddress?: string, deviceInfo?: string) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });

        if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
            throw new UnauthorizedException('E-mail ou senha incorretos');
        }
        if (!user.isActive) throw new UnauthorizedException('Conta desativada');
        if (user.isBanned) throw new UnauthorizedException('Conta suspensa');
        if (!user.emailVerified) throw new UnauthorizedException('Verifique seu e-mail antes de entrar');

        // 2FA required
        if (user.twoFactorEnabled) {
            if (!dto.totpCode) {
                return { requiresTwoFactor: true, message: 'Informe o código 2FA' };
            }
            const isValidTotp = authenticator.verify({
                token: dto.totpCode,
                secret: user.twoFactorSecret!,
            });
            if (!isValidTotp) throw new UnauthorizedException('Código 2FA inválido');
        }

        // Create session
        const sessionId = this.generateSecureToken();
        const sessionHash = await bcrypt.hash(sessionId, 8);
        await this.prisma.$transaction([
            this.prisma.userSession.create({
                data: {
                    userId: user.id,
                    tokenHash: sessionHash,
                    ipAddress,
                    deviceInfo,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            }),
            this.prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            }),
        ]);

        return this.issueTokens(user.id, user.email, user.role, sessionId);
    }

    // ── REFRESH TOKEN ─────────────────────────────────────────────────
    async refresh(refreshToken: string) {
        let payload: any;
        try {
            payload = this.jwt.verify(refreshToken, {
                secret: this.config.get('JWT_REFRESH_SECRET'),
            });
        } catch {
            throw new UnauthorizedException('Refresh token inválido');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, email: true, role: true, isActive: true, isBanned: true },
        });

        if (!user || !user.isActive || user.isBanned) {
            throw new UnauthorizedException('Sessão inválida');
        }

        const newSessionId = this.generateSecureToken();
        return this.issueTokens(user.id, user.email, user.role, newSessionId);
    }

    // ── FORGOT PASSWORD ───────────────────────────────────────────────
    async forgotPassword(email: string) {
        const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        // Always return same message to prevent email enumeration
        if (!user) return { message: 'Se o e-mail existir, você receberá as instruções.' };

        const token = this.generateSecureToken();
        await this.prisma.emailToken.create({
            data: {
                userId: user.id,
                token,
                type: 'password_reset',
                expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
            },
        });

        // Send password reset email
        try {
            await this.emailService.sendPasswordResetEmail(user.email, user.name, token);
        } catch (err) {
            this.logger.error(`Failed to send password reset email: ${err.message}`);
        }
        return { message: 'Se o e-mail existir, você receberá as instruções.' };
    }

    // ── RESET PASSWORD ────────────────────────────────────────────────
    async resetPassword(token: string, newPassword: string) {
        const emailToken = await this.prisma.emailToken.findUnique({
            where: { token },
        });
        if (!emailToken || emailToken.type !== 'password_reset' || emailToken.usedAt) {
            throw new BadRequestException('Token inválido ou expirado');
        }
        if (emailToken.expiresAt < new Date()) throw new BadRequestException('Token expirado');

        const passwordHash = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);

        await this.prisma.$transaction([
            this.prisma.user.update({ where: { id: emailToken.userId }, data: { passwordHash } }),
            this.prisma.emailToken.update({ where: { id: emailToken.id }, data: { usedAt: new Date() } }),
            // Invalidate all sessions for security
            this.prisma.userSession.deleteMany({ where: { userId: emailToken.userId } }),
        ]);

        return { message: 'Senha redefinida com sucesso!' };
    }

    // ── 2FA SETUP ─────────────────────────────────────────────────────
    async setup2fa(userId: string) {
        const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
        if (user.twoFactorEnabled) throw new BadRequestException('2FA já está ativo');

        const secret = authenticator.generateSecret();
        const appName = 'MultMarkets';
        const otpAuthUrl = authenticator.keyuri(user.email, appName, secret);
        const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

        // Store temp secret (not enabled yet)
        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret },
        });

        return { secret, qrCode: qrCodeDataUrl, otpAuthUrl };
    }

    async enable2fa(userId: string, code: string) {
        const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
        if (!user.twoFactorSecret) throw new BadRequestException('Configure o 2FA primeiro');
        if (user.twoFactorEnabled) throw new BadRequestException('2FA já está ativo');

        const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
        if (!isValid) throw new BadRequestException('Código inválido');

        // Generate 8 backup codes
        const backupCodes = Array.from({ length: 8 }, () => this.generateBackupCode());
        const hashedCodes = await Promise.all(backupCodes.map((c) => bcrypt.hash(c, 8)));

        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: true, backupCodes: hashedCodes },
        });

        return { message: '2FA ativado!', backupCodes }; // Show only once
    }

    async disable2fa(userId: string, code: string) {
        const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
        if (!user.twoFactorEnabled) throw new BadRequestException('2FA não está ativo');

        const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret! });
        if (!isValid) throw new BadRequestException('Código inválido');

        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: false, twoFactorSecret: null, backupCodes: [] },
        });

        return { message: '2FA desativado' };
    }

    // ── LOGOUT ────────────────────────────────────────────────────────
    async logout(sessionId: string) {
        await this.prisma.userSession.deleteMany({ where: { tokenHash: sessionId } });
        return { message: 'Sessão encerrada' };
    }

    // ── HELPERS ───────────────────────────────────────────────────────
    private issueTokens(userId: string, email: string, role: string, sessionId: string) {
        const payload = { sub: userId, email, role, sessionId };

        const accessToken = this.jwt.sign(payload, {
            secret: this.config.get('JWT_SECRET'),
            expiresIn: JWT.ACCESS_EXPIRY,
        });

        const refreshToken = this.jwt.sign(payload, {
            secret: this.config.get('JWT_REFRESH_SECRET'),
            expiresIn: JWT.REFRESH_EXPIRY,
        });

        return { accessToken, refreshToken, expiresIn: 900 }; // 15min in seconds
    }

    private generateSecureToken(): string {
        return require('crypto').randomBytes(32).toString('hex');
    }

    private generateBackupCode(): string {
        return require('crypto').randomBytes(4).toString('hex').toUpperCase();
    }
}
