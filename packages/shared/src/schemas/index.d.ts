import { z } from 'zod';
export declare const emailSchema: z.ZodString;
export declare const passwordSchema: z.ZodString;
export declare const usernameSchema: z.ZodString;
export declare const registerSchema: z.ZodObject<{
    name: z.ZodString;
    username: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    username: string;
    email: string;
    password: string;
}, {
    name: string;
    username: string;
    email: string;
    password: string;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    totpCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    totpCode?: string | undefined;
}, {
    email: string;
    password: string;
    totpCode?: string | undefined;
}>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const resetPasswordSchema: z.ZodEffects<z.ZodObject<{
    token: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    token: string;
    confirmPassword: string;
}, {
    password: string;
    token: string;
    confirmPassword: string;
}>, {
    password: string;
    token: string;
    confirmPassword: string;
}, {
    password: string;
    token: string;
    confirmPassword: string;
}>;
export declare const verify2faSchema: z.ZodObject<{
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
}, {
    code: string;
}>;
export declare const createMarketSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    resolutionCriteria: z.ZodString;
    categoryId: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodOptional<z.ZodString>;
    sourceUrl: z.ZodOptional<z.ZodString>;
    resolutionDate: z.ZodOptional<z.ZodString>;
    initialLiquidity: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    description: string;
    title: string;
    resolutionCriteria: string;
    initialLiquidity: number;
    imageUrl?: string | undefined;
    resolutionDate?: string | undefined;
    categoryId?: string | undefined;
    sourceUrl?: string | undefined;
}, {
    description: string;
    title: string;
    resolutionCriteria: string;
    imageUrl?: string | undefined;
    resolutionDate?: string | undefined;
    categoryId?: string | undefined;
    sourceUrl?: string | undefined;
    initialLiquidity?: number | undefined;
}>;
export declare const resolveMarketSchema: z.ZodObject<{
    outcome: z.ZodEnum<["YES", "NO", "CANCELLED"]>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    outcome: "CANCELLED" | "YES" | "NO";
    notes?: string | undefined;
}, {
    outcome: "CANCELLED" | "YES" | "NO";
    notes?: string | undefined;
}>;
export declare const tradeSchema: z.ZodObject<{
    marketId: z.ZodString;
    side: z.ZodEnum<["YES", "NO"]>;
    type: z.ZodEnum<["BUY", "SELL"]>;
    amount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "BUY" | "SELL";
    marketId: string;
    side: "YES" | "NO";
    amount: number;
}, {
    type: "BUY" | "SELL";
    marketId: string;
    side: "YES" | "NO";
    amount: number;
}>;
export declare const tradePreviewSchema: z.ZodObject<{
    marketId: z.ZodString;
    side: z.ZodEnum<["YES", "NO"]>;
    type: z.ZodEnum<["BUY", "SELL"]>;
    amount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "BUY" | "SELL";
    marketId: string;
    side: "YES" | "NO";
    amount: number;
}, {
    type: "BUY" | "SELL";
    marketId: string;
    side: "YES" | "NO";
    amount: number;
}>;
export declare const depositSchema: z.ZodObject<{
    amount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    amount: number;
}, {
    amount: number;
}>;
export declare const withdrawSchema: z.ZodObject<{
    amount: z.ZodNumber;
    pixKey: z.ZodString;
}, "strip", z.ZodTypeAny, {
    amount: number;
    pixKey: string;
}, {
    amount: number;
    pixKey: string;
}>;
export declare const updateProfileSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    bio?: string | undefined;
    avatarUrl?: string | undefined;
}, {
    name?: string | undefined;
    bio?: string | undefined;
    avatarUrl?: string | undefined;
}>;
export declare const changePasswordSchema: z.ZodEffects<z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    confirmPassword: string;
    currentPassword: string;
    newPassword: string;
}, {
    confirmPassword: string;
    currentPassword: string;
    newPassword: string;
}>, {
    confirmPassword: string;
    currentPassword: string;
    newPassword: string;
}, {
    confirmPassword: string;
    currentPassword: string;
    newPassword: string;
}>;
export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type TradeDto = z.infer<typeof tradeSchema>;
export type CreateMarketDto = z.infer<typeof createMarketSchema>;
export type ResolveMarketDto = z.infer<typeof resolveMarketSchema>;
export type DepositDto = z.infer<typeof depositSchema>;
export type WithdrawDto = z.infer<typeof withdrawSchema>;
