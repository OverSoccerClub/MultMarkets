// packages/shared/src/schemas/index.ts
// Zod validation schemas shared between API and frontend

import { z } from 'zod';

export const emailSchema = z.string().email('E-mail inválido').toLowerCase();
export const passwordSchema = z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter ao menos um número');

export const usernameSchema = z
    .string()
    .min(3, 'Username deve ter no mínimo 3 caracteres')
    .max(30, 'Username deve ter no máximo 30 caracteres')
    .regex(/^[a-z0-9_]+$/, 'Username pode conter apenas letras minúsculas, números e _');

// ── Auth schemas ──────────────────────────────────────────────────────
export const registerSchema = z.object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100),
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
});

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Senha é obrigatória'),
    totpCode: z.string().length(6).optional(),
});

export const forgotPasswordSchema = z.object({
    email: emailSchema,
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1),
    password: passwordSchema,
    confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
    message: 'Senhas não coincidem',
    path: ['confirmPassword'],
});

export const verify2faSchema = z.object({
    code: z.string().length(6, 'Código deve ter 6 dígitos'),
});

// ── Market schemas ────────────────────────────────────────────────────
export const createMarketSchema = z.object({
    title: z.string().min(10, 'Título deve ter no mínimo 10 caracteres').max(300),
    description: z.string().min(20).max(5000),
    resolutionCriteria: z.string().min(20).max(2000),
    categoryId: z.string().optional(),
    imageUrl: z.string().url().optional(),
    sourceUrl: z.string().url().optional(),
    resolutionDate: z.string().datetime().optional(),
    initialLiquidity: z.number().min(10).max(10000).default(100),
});

export const resolveMarketSchema = z.object({
    outcome: z.enum(['YES', 'NO', 'CANCELLED']),
    notes: z.string().optional(),
});

// ── Trade schemas ─────────────────────────────────────────────────────
export const tradeSchema = z.object({
    marketId: z.string().min(1),
    side: z.enum(['YES', 'NO']),
    type: z.enum(['BUY', 'SELL']),
    amount: z.number().positive('Valor deve ser positivo').min(1, 'Valor mínimo é R$ 1,00'),
});

export const tradePreviewSchema = z.object({
    marketId: z.string().min(1),
    side: z.enum(['YES', 'NO']),
    type: z.enum(['BUY', 'SELL']),
    amount: z.number().positive(),
});

// ── Wallet schemas ────────────────────────────────────────────────────
export const depositSchema = z.object({
    amount: z.number().min(10, 'Depósito mínimo é R$ 10,00').max(50000),
});

export const withdrawSchema = z.object({
    amount: z.number().min(10, 'Saque mínimo é R$ 10,00'),
    pixKey: z.string().min(5, 'Chave PIX inválida'),
});

// ── Profile schemas ───────────────────────────────────────────────────
export const updateProfileSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    bio: z.string().max(500).optional(),
    avatarUrl: z.string().url().optional(),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Senhas não coincidem',
    path: ['confirmPassword'],
});

// ── Types inferred from schemas ───────────────────────────────────────
export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type TradeDto = z.infer<typeof tradeSchema>;
export type CreateMarketDto = z.infer<typeof createMarketSchema>;
export type ResolveMarketDto = z.infer<typeof resolveMarketSchema>;
export type DepositDto = z.infer<typeof depositSchema>;
export type WithdrawDto = z.infer<typeof withdrawSchema>;
