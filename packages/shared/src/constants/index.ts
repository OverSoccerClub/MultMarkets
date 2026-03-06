// packages/shared/src/constants/index.ts

export const PLATFORM = {
    NAME: 'MultMarkets',
    CURRENCY: 'BRL',
    TRADE_FEE_PERCENT: 0.02, // 2%
    MIN_TRADE_AMOUNT: 1,
    MIN_DEPOSIT: 10,
    MIN_WITHDRAW: 10,
    INITIAL_LIQUIDITY: 100, // BRL added to each new market
    AMM_ALPHA: 100, // LMSR b parameter
} as const;

export const JWT = {
    ACCESS_EXPIRY: '15m',
    REFRESH_EXPIRY: '7d',
    EMAIL_VERIFY_EXPIRY: '24h',
    RESET_PASSWORD_EXPIRY: '1h',
} as const;

export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
} as const;

export const MARKET_CATEGORIES = [
    { slug: 'politica', name: 'Política', icon: '🏛️', color: '#6366f1' },
    { slug: 'economia', name: 'Economia', icon: '💹', color: '#10b981' },
    { slug: 'esportes', name: 'Esportes', icon: '⚽', color: '#f59e0b' },
    { slug: 'tecnologia', name: 'Tecnologia', icon: '💻', color: '#0099ff' },
    { slug: 'entretenimento', name: 'Entretenimento', icon: '🎬', color: '#a855f7' },
    { slug: 'ciencia', name: 'Ciência', icon: '🔬', color: '#14b8a6' },
    { slug: 'saude', name: 'Saúde', icon: '🏥', color: '#f43f5e' },
    { slug: 'internacional', name: 'Internacional', icon: '🌍', color: '#64748b' },
    { slug: 'crypto', name: 'Crypto & Web3', icon: '₿', color: '#ffca28' },
    { slug: 'outros', name: 'Outros', icon: '📌', color: '#94a3b8' },
] as const;
