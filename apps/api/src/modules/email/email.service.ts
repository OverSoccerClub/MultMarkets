import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private transporter: nodemailer.Transporter | null = null;
    private readonly isConfigured: boolean;

    constructor(private config: ConfigService) {
        const host = this.config.get<string>('SMTP_HOST', '');
        const pass = this.config.get<string>('SMTP_PASS', '');

        // Only create transporter if SMTP is properly configured
        this.isConfigured = !!(host && pass && pass !== 'placeholder');

        if (this.isConfigured) {
            this.transporter = nodemailer.createTransport({
                host,
                port: this.config.get<number>('SMTP_PORT', 587),
                secure: false,
                auth: {
                    user: this.config.get<string>('SMTP_USER', ''),
                    pass,
                },
            });
            this.logger.log('Email service configured with SMTP');
        } else {
            this.logger.warn('SMTP not configured — emails will be logged to console only');
        }
    }

    /** Returns true if real SMTP is configured and emails will be sent */
    get isSmtpConfigured(): boolean {
        return this.isConfigured;
    }

    async sendVerificationEmail(to: string, userName: string, token: string): Promise<void> {
        const clientUrl = this.config.get<string>('CLIENT_URL', 'http://localhost:3000');
        const verifyUrl = `${clientUrl}/auth/verify-email?token=${token}`;
        const from = this.config.get<string>('SMTP_FROM', '"MultMarkets" <noreply@multmarkets.com>');

        const subject = 'Verifique seu e-mail — MultMarkets';
        const html = `
            <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #0a0a0a; color: #f8f9fa; border-radius: 12px;">
                <h1 style="color: #10B981; margin-bottom: 8px; font-size: 24px;">MultMarkets</h1>
                <p style="color: #a1a1a1; margin-bottom: 24px; font-size: 14px;">Plataforma de Mercados de Previsão</p>
                <hr style="border: none; border-top: 1px solid #1a1a1a; margin: 16px 0;" />
                <h2 style="font-size: 20px; margin-bottom: 16px;">Olá, ${userName}! 👋</h2>
                <p style="color: #a1a1a1; line-height: 1.6; font-size: 15px;">
                    Obrigado por se cadastrar na MultMarkets. Para concluir seu cadastro e começar a operar, 
                    clique no botão abaixo para verificar seu e-mail:
                </p>
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${verifyUrl}" 
                       style="display: inline-block; background: #10B981; color: #fff; padding: 14px 32px; 
                              text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        Verificar meu e-mail
                    </a>
                </div>
                <p style="color: #666; font-size: 13px; line-height: 1.5;">
                    Se o botão não funcionar, copie e cole este link no navegador:<br/>
                    <a href="${verifyUrl}" style="color: #10B981; word-break: break-all;">${verifyUrl}</a>
                </p>
                <p style="color: #666; font-size: 13px;">Este link expira em 24 horas.</p>
                <hr style="border: none; border-top: 1px solid #1a1a1a; margin: 24px 0 16px;" />
                <p style="color: #444; font-size: 12px;">
                    Se você não criou esta conta, ignore este e-mail.
                </p>
            </div>
        `;

        if (this.transporter) {
            try {
                await this.transporter.sendMail({ from, to, subject, html });
                this.logger.log(`Verification email sent to ${to}`);
            } catch (error) {
                this.logger.error(`Failed to send verification email to ${to}: ${error.message}`);
                throw error;
            }
        } else {
            this.logger.warn(`[DEV] Verification email for ${to}: ${verifyUrl}`);
        }
    }

    async sendOtpEmail(to: string, userName: string, code: string): Promise<void> {
        const from = this.config.get<string>('SMTP_FROM', '"MultMarkets" <noreply@multmarkets.com>');
        const subject = 'Código de Verificação KYC — MultMarkets';
        
        const html = `
            <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #0a0a0a; color: #f8f9fa; border-radius: 12px;">
                <h1 style="color: #10B981; margin-bottom: 8px; font-size: 24px;">MultMarkets</h1>
                <p style="color: #a1a1a1; margin-bottom: 24px; font-size: 14px;">Autenticação Segura</p>
                <hr style="border: none; border-top: 1px solid #1a1a1a; margin: 16px 0;" />
                <h2 style="font-size: 20px; margin-bottom: 16px;">Olá, ${userName}!</h2>
                <p style="color: #a1a1a1; line-height: 1.6; font-size: 15px;">
                    Seu código de verificação para acesso seguro à MultMarkets é:
                </p>
                <div style="text-align: center; margin: 32px 0;">
                    <div style="display: inline-block; background: #1a1a1a; border: 1px solid #333; color: #fff; padding: 14px 40px; border-radius: 8px; font-weight: 800; font-size: 32px; letter-spacing: 8px;">
                        ${code}
                    </div>
                </div>
                <p style="color: #666; font-size: 13px;">Este código expira em 10 minutos.</p>
                <hr style="border: none; border-top: 1px solid #1a1a1a; margin: 24px 0 16px;" />
                <p style="color: #444; font-size: 12px;">
                    Se você não solicitou este código, ignore este e-mail.
                </p>
            </div>
        `;

        if (this.transporter) {
            try {
                await this.transporter.sendMail({ from, to, subject, html });
                this.logger.log(`OTP mail sent to ${to}`);
            } catch (error) {
                this.logger.error(`Failed to send OTP to ${to}: ${error.message}`);
            }
        } else {
            this.logger.warn(`[DEV] EMAIL_OTP for ${to}: ${code}`);
        }
    }

    async sendPasswordResetEmail(to: string, userName: string, token: string): Promise<void> {
        const clientUrl = this.config.get<string>('CLIENT_URL', 'http://localhost:3000');
        const resetUrl = `${clientUrl}/auth/reset-password?token=${token}`;
        const from = this.config.get<string>('SMTP_FROM', '"MultMarkets" <noreply@multmarkets.com>');

        const subject = 'Redefinição de senha — MultMarkets';
        const html = `
            <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #0a0a0a; color: #f8f9fa; border-radius: 12px;">
                <h1 style="color: #10B981; margin-bottom: 8px; font-size: 24px;">MultMarkets</h1>
                <p style="color: #a1a1a1; margin-bottom: 24px; font-size: 14px;">Redefinição de Senha</p>
                <hr style="border: none; border-top: 1px solid #1a1a1a; margin: 16px 0;" />
                <h2 style="font-size: 20px; margin-bottom: 16px;">Olá, ${userName}!</h2>
                <p style="color: #a1a1a1; line-height: 1.6; font-size: 15px;">
                    Recebemos uma solicitação para redefinir a senha da sua conta. 
                    Clique no botão abaixo para criar uma nova senha:
                </p>
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${resetUrl}" 
                       style="display: inline-block; background: #f59e0b; color: #000; padding: 14px 32px; 
                              text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        Redefinir senha
                    </a>
                </div>
                <p style="color: #666; font-size: 13px;">Este link expira em 1 hora.</p>
                <hr style="border: none; border-top: 1px solid #1a1a1a; margin: 24px 0 16px;" />
                <p style="color: #444; font-size: 12px;">
                    Se você não solicitou esta redefinição, ignore este e-mail.
                </p>
            </div>
        `;

        if (this.transporter) {
            try {
                await this.transporter.sendMail({ from, to, subject, html });
                this.logger.log(`Password reset email sent to ${to}`);
            } catch (error) {
                this.logger.error(`Failed to send password reset email to ${to}: ${error.message}`);
                throw error;
            }
        } else {
            this.logger.warn(`[DEV] Password reset email for ${to}: ${resetUrl}`);
        }
    }
}
