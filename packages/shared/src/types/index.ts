// packages/shared/src/types/index.ts
// Shared TypeScript types used across API, Web, and Mobile

export type UserRole = 'USER' | 'ADMIN' | 'OPERATOR';
export type MarketStatus = 'DRAFT' | 'PENDING' | 'ACTIVE' | 'RESOLVED' | 'CANCELLED' | 'CLOSED';
export type MarketOutcome = 'YES' | 'NO' | 'CANCELLED';
export type TradeSide = 'YES' | 'NO';
export type TradeType = 'BUY' | 'SELL';
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'BET_DEBIT' | 'BET_REFUND' | 'PAYOUT' | 'FEE' | 'BONUS';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

// ── API Response wrapper ──────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    meta?: PaginationMeta;
}

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface PaginationQuery {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

// ── User types ────────────────────────────────────────────────────────
export interface UserPublic {
    id: string;
    username: string;
    name: string;
    avatarUrl: string | null;
    role: UserRole;
    createdAt: string;
    stats: {
        totalVolume: number;
        totalPnl: number;
        marketsTraded: number;
    };
}

export interface UserPrivate extends UserPublic {
    email: string;
    emailVerified: boolean;
    twoFactorEnabled: boolean;
    isActive: boolean;
    lastLoginAt: string | null;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

// ── Wallet types ──────────────────────────────────────────────────────
export interface WalletSummary {
    id: string;
    balance: number;
    lockedBalance: number;
    available: number; // balance - lockedBalance
    currency: string;
}

export interface WalletTransaction {
    id: string;
    type: TransactionType;
    status: TransactionStatus;
    amount: number;
    description: string | null;
    createdAt: string;
}

// ── Market types ──────────────────────────────────────────────────────
export interface MarketSummary {
    id: string;
    slug: string;
    title: string;
    imageUrl: string | null;
    status: MarketStatus;
    yesPrice: number;
    noPrice: number;
    totalVolume: number;
    uniqueTraders: number;
    resolutionDate: string | null;
    category: { id: string; name: string; slug: string; icon: string | null; color: string | null } | null;
    createdAt: string;
}

export interface MarketDetail extends MarketSummary {
    description: string;
    resolutionCriteria: string;
    sourceUrl: string | null;
    yesShares: number;
    noShares: number;
    liquidityPool: number;
    outcome: MarketOutcome | null;
    resolvedAt: string | null;
}

export interface MarketPricePoint {
    timestamp: string;
    yesPrice: number;
    noPrice: number;
    volume: number;
}

// ── Trading types ─────────────────────────────────────────────────────
export interface TradePreview {
    side: TradeSide;
    shares: number;
    pricePerShare: number;
    totalCost: number;
    fee: number;
    newYesPrice: number;
    newNoPrice: number;
    priceImpact: number; // percentage
}

export interface Position {
    id: string;
    marketId: string;
    market: MarketSummary;
    side: TradeSide;
    shares: number;
    avgPrice: number;
    totalCost: number;
    currentPrice: number;
    currentValue: number;
    unrealizedPnl: number;
    unrealizedPnlPercent: number;
    realizedPnl: number;
}

export interface Trade {
    id: string;
    marketId: string;
    market: Pick<MarketSummary, 'id' | 'title' | 'slug'>;
    type: TradeType;
    side: TradeSide;
    shares: number;
    price: number;
    totalCost: number;
    fee: number;
    createdAt: string;
}

// ── Bot types ─────────────────────────────────────────────────────────
export interface BotMarketDraft {
    id: string;
    generatedTitle: string;
    generatedDescription: string;
    resolutionCriteria: string;
    suggestedCategory: string | null;
    suggestedEndDate: string | null;
    status: string;
    topic: {
        title: string;
        url: string | null;
        viralityScore: number;
        finalScore: number;
    } | null;
    createdAt: string;
}

// ── WebSocket event types ─────────────────────────────────────────────
export interface WsMarketUpdate {
    marketId: string;
    yesPrice: number;
    noPrice: number;
    totalVolume: number;
    timestamp: string;
}

export interface WsNotification {
    id: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
}
