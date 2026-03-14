import {
    Injectable, BadRequestException, UnauthorizedException,
    ConflictException, NotFoundException, Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { randomUUID as uuid, randomInt, createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto, VerifyKycDto, UpdateProfileDto, ResetPasswordDto } from './dto/auth.dto';
import { EmailService } from '../email/email.service';
import { SmsService } from '../email/sms.service';
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
        private smsService: SmsService,
    ) { }

    // ── HELPERS ──────────────────────────────────────────────────────
    private isValidCpf(cpf: string): boolean {
        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
        let sum = 0;
        let remainder;
        for (let i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.substring(9, 10))) return false;
        sum = 0;
        for (let i = 1; i <= 10; i++) sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.substring(10, 11))) return false;
        return true;
    }

    private generateOtp(): string {
        return randomInt(100000, 999999).toString();
    }

    // ── REGISTER ─────────────────────────────────────────────────────
    async register(dto: RegisterDto) {
        // Validação CPF
        const cleanCpf = dto.cpf.replace(/\D/g, '');
        if (!this.isValidCpf(cleanCpf)) {
            throw new BadRequestException('O CPF informado é inválido. Digite um CPF real.');
        }

        // Validação Phone
        const cleanPhone = dto.phone.replace(/\D/g, '');
        if (cleanPhone.length < 10 || cleanPhone.length > 15) {
            throw new BadRequestException('Número de telefone inválido.');
        }

        // Check uniqueness
        const existing = await this.prisma.user.findFirst({
            where: { OR: [{ email: dto.email }, { username: dto.username }, { cpf: cleanCpf }, { phone: cleanPhone }] },
        });
        if (existing?.email === dto.email) throw new ConflictException('E-mail já cadastrado.');
        if (existing?.username === dto.username) throw new ConflictException('Username já em uso.');
        if (existing?.cpf === cleanCpf) throw new ConflictException('Este CPF já possui cadastro.');
        if (existing?.phone === cleanPhone) throw new ConflictException('Este telefone já possui cadastro.');

        const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);

        const emailCode = this.generateOtp();
        const smsCode = this.generateOtp();

        const user = await this.prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    name: dto.name,
                    username: dto.username.toLowerCase(),
                    email: dto.email.toLowerCase(),
                    cpf: cleanCpf,
                    phone: cleanPhone,
                    passwordHash,
                    emailVerified: false,
                    phoneVerified: false,
                },
            });

            // Create wallet on registration (skip for ADMINs)
            if (newUser.role !== 'ADMIN') {
                await tx.wallet.create({
                    data: { userId: newUser.id },
                });
            }

            // Create 6-digit verification codes
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
            await tx.verificationCode.createMany({
                data: [
                    { userId: newUser.id, code: emailCode, type: 'EMAIL_OTP', expiresAt },
                    { userId: newUser.id, code: smsCode, type: 'SMS_OTP', expiresAt },
                ],
            });

            return newUser;
        });

        this.logger.log(`New user registered: ${user.email} - pending KYC`);

        // Dispara email
        await this.emailService.sendOtpEmail(user.email, user.name, emailCode);
        // Dispara SMS
        await this.smsService.sendVerificationSms(user.phone!, smsCode);

        // Não retorna sessionId ou token. O usuário precisa da verificação.
        return { message: 'Conta criada. Insira os códigos enviados para seu E-mail e Celular.', userId: user.id };
    }

    // ── VERIFY KYC (DOUBLE OTP) ──────────────────────────────────────
    async verifyKyc(dto: VerifyKycDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: dto.userId },
            include: { verificationCodes: { where: { usedAt: null, expiresAt: { gt: new Date() } } } }
        });

        if (!user) throw new NotFoundException('Usuário não encontrado.');
        if (user.emailVerified && user.phoneVerified) {
            throw new BadRequestException('Usuário já validado.');
        }

        const emailTokens = user.verificationCodes.filter(c => c.type === 'EMAIL_OTP');
        const smsTokens = user.verificationCodes.filter(c => c.type === 'SMS_OTP');

        const validEmailCode = emailTokens.find(c => c.code === dto.emailCode);
        const validSmsCode = dto.smsCode ? smsTokens.find(c => c.code === dto.smsCode) : null;

        if (!validEmailCode) {
            throw new BadRequestException('Código de E-mail incorreto ou expirado.');
        }
        
        if (dto.smsCode && !validSmsCode) {
            throw new BadRequestException('Código SMS incorreto ou expirado.');
        }

        const codesToUpdate = [validEmailCode.id];
        if (validSmsCode) codesToUpdate.push(validSmsCode.id);

        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: user.id },
                data: { 
                    emailVerified: true, 
                    ...(validSmsCode && { phoneVerified: true }) 
                },
            }),
            this.prisma.verificationCode.updateMany({
                where: { id: { in: codesToUpdate } },
                data: { usedAt: new Date() },
            })
        ]);

        return { message: 'Conta validada com sucesso! Você já pode fazer login.' };
    }

    async resendVerification(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('Usuário não encontrado.');
        if (user.emailVerified) throw new BadRequestException('Usuário já verificado.');

        const emailCode = this.generateOtp();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await this.prisma.verificationCode.create({
            data: { userId: user.id, code: emailCode, type: 'EMAIL_OTP', expiresAt },
        });

        await this.emailService.sendOtpEmail(user.email, user.name, emailCode);
        return { message: 'Novo código enviado para seu e-mail.' };
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
        const sessionHash = createHash('sha256').update(sessionId).digest('hex');
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

        // Validate old session exists
        const oldSessionHash = createHash('sha256').update(payload.sessionId).digest('hex');
        const oldSession = await this.prisma.userSession.findFirst({
            where: { tokenHash: oldSessionHash, expiresAt: { gt: new Date() } }
        });

        if (!oldSession) {
            throw new UnauthorizedException('Sessão expirada ou não encontrada');
        }

        // Revoke old session
        await this.prisma.userSession.delete({ where: { id: oldSession.id } });

        const newSessionId = this.generateSecureToken();
        const sessionHash = createHash('sha256').update(newSessionId).digest('hex');
        
        await this.prisma.userSession.create({
            data: {
                userId: user.id,
                tokenHash: sessionHash,
                ipAddress: oldSession.ipAddress,
                deviceInfo: oldSession.deviceInfo,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });

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
    async getSessions(userId: string) {
        return this.prisma.userSession.findMany({
            where: { userId, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: 'desc' },
        });
    }

    // ── PROFILE UPDATE ───────────────────────────────────────────────
    async updateProfile(userId: string, data: UpdateProfileDto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('Usuário não encontrado');
        
        // Bloquear alteração de CPF se já existir e tentar mudar
        if (data.cpf && user.cpf && user.cpf !== data.cpf) {
            throw new BadRequestException('O CPF não pode ser alterado após o cadastro inicial.');
        }

        // Validação e formatação do CPF
        if (data.cpf) {
            const cleanCpf = data.cpf.replace(/\D/g, '');
            if (cleanCpf.length !== 11) {
                throw new BadRequestException('CPF inválido. Certifique-se de inserir os 11 dígitos.');
            }
            const existingCpf = await this.prisma.user.findUnique({ where: { cpf: cleanCpf } });
            if (existingCpf && existingCpf.id !== userId) {
                throw new ConflictException('Este CPF já está em uso em outra conta.');
            }
            data.cpf = cleanCpf;
        }

        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.cpf && { cpf: data.cpf }),
                ...(data.bio && { bio: data.bio }),
                ...(data.avatarUrl && { avatarUrl: data.avatarUrl }),
            },
            select: {
                id: true,
                email: true,
                username: true,
                name: true,
                cpf: true,
                bio: true,
                avatarUrl: true,
            }
        });

        return { message: 'Perfil atualizado com sucesso!', user: updatedUser };
    }

    async logout(sessionId: string) {
        const sessionHash = createHash('sha256').update(sessionId).digest('hex');
        await this.prisma.userSession.deleteMany({ where: { tokenHash: sessionHash } });
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
