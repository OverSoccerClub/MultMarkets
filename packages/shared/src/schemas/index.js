"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.updateProfileSchema = exports.withdrawSchema = exports.depositSchema = exports.tradePreviewSchema = exports.tradeSchema = exports.resolveMarketSchema = exports.createMarketSchema = exports.verify2faSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.registerSchema = exports.usernameSchema = exports.passwordSchema = exports.emailSchema = void 0;
const zod_1 = require("zod");
exports.emailSchema = zod_1.z.string().email('E-mail inválido').toLowerCase();
exports.passwordSchema = zod_1.z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter ao menos um número');
exports.usernameSchema = zod_1.z
    .string()
    .min(3, 'Username deve ter no mínimo 3 caracteres')
    .max(30, 'Username deve ter no máximo 30 caracteres')
    .regex(/^[a-z0-9_]+$/, 'Username pode conter apenas letras minúsculas, números e _');
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100),
    username: exports.usernameSchema,
    email: exports.emailSchema,
    password: exports.passwordSchema,
});
exports.loginSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: zod_1.z.string().min(1, 'Senha é obrigatória'),
    totpCode: zod_1.z.string().length(6).optional(),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: exports.emailSchema,
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
    password: exports.passwordSchema,
    confirmPassword: zod_1.z.string(),
}).refine((d) => d.password === d.confirmPassword, {
    message: 'Senhas não coincidem',
    path: ['confirmPassword'],
});
exports.verify2faSchema = zod_1.z.object({
    code: zod_1.z.string().length(6, 'Código deve ter 6 dígitos'),
});
exports.createMarketSchema = zod_1.z.object({
    title: zod_1.z.string().min(10, 'Título deve ter no mínimo 10 caracteres').max(300),
    description: zod_1.z.string().min(20).max(5000),
    resolutionCriteria: zod_1.z.string().min(20).max(2000),
    categoryId: zod_1.z.string().optional(),
    imageUrl: zod_1.z.string().url().optional(),
    sourceUrl: zod_1.z.string().url().optional(),
    resolutionDate: zod_1.z.string().datetime().optional(),
    initialLiquidity: zod_1.z.number().min(10).max(10000).default(100),
});
exports.resolveMarketSchema = zod_1.z.object({
    outcome: zod_1.z.enum(['YES', 'NO', 'CANCELLED']),
    notes: zod_1.z.string().optional(),
});
exports.tradeSchema = zod_1.z.object({
    marketId: zod_1.z.string().min(1),
    side: zod_1.z.enum(['YES', 'NO']),
    type: zod_1.z.enum(['BUY', 'SELL']),
    amount: zod_1.z.number().positive('Valor deve ser positivo').min(1, 'Valor mínimo é R$ 1,00'),
});
exports.tradePreviewSchema = zod_1.z.object({
    marketId: zod_1.z.string().min(1),
    side: zod_1.z.enum(['YES', 'NO']),
    type: zod_1.z.enum(['BUY', 'SELL']),
    amount: zod_1.z.number().positive(),
});
exports.depositSchema = zod_1.z.object({
    amount: zod_1.z.number().min(10, 'Depósito mínimo é R$ 10,00').max(50000),
});
exports.withdrawSchema = zod_1.z.object({
    amount: zod_1.z.number().min(10, 'Saque mínimo é R$ 10,00'),
    pixKey: zod_1.z.string().min(5, 'Chave PIX inválida'),
});
exports.updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).optional(),
    bio: zod_1.z.string().max(500).optional(),
    avatarUrl: zod_1.z.string().url().optional(),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1),
    newPassword: exports.passwordSchema,
    confirmPassword: zod_1.z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Senhas não coincidem',
    path: ['confirmPassword'],
});
//# sourceMappingURL=index.js.map