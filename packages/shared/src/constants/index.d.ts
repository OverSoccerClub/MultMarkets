export declare const PLATFORM: {
    readonly NAME: "MultMarkets";
    readonly CURRENCY: "BRL";
    readonly TRADE_FEE_PERCENT: 0.02;
    readonly MIN_TRADE_AMOUNT: 1;
    readonly MIN_DEPOSIT: 10;
    readonly MIN_WITHDRAW: 10;
    readonly INITIAL_LIQUIDITY: 100;
    readonly AMM_ALPHA: 100;
};
export declare const JWT: {
    readonly ACCESS_EXPIRY: "15m";
    readonly REFRESH_EXPIRY: "7d";
    readonly EMAIL_VERIFY_EXPIRY: "24h";
    readonly RESET_PASSWORD_EXPIRY: "1h";
};
export declare const PAGINATION: {
    readonly DEFAULT_PAGE: 1;
    readonly DEFAULT_LIMIT: 20;
    readonly MAX_LIMIT: 100;
};
export declare const MARKET_CATEGORIES: readonly [{
    readonly slug: "politica";
    readonly name: "Política";
    readonly icon: "🏛️";
    readonly color: "#6366f1";
}, {
    readonly slug: "economia";
    readonly name: "Economia";
    readonly icon: "💹";
    readonly color: "#10b981";
}, {
    readonly slug: "esportes";
    readonly name: "Esportes";
    readonly icon: "⚽";
    readonly color: "#f59e0b";
}, {
    readonly slug: "tecnologia";
    readonly name: "Tecnologia";
    readonly icon: "💻";
    readonly color: "#0099ff";
}, {
    readonly slug: "entretenimento";
    readonly name: "Entretenimento";
    readonly icon: "🎬";
    readonly color: "#a855f7";
}, {
    readonly slug: "ciencia";
    readonly name: "Ciência";
    readonly icon: "🔬";
    readonly color: "#14b8a6";
}, {
    readonly slug: "saude";
    readonly name: "Saúde";
    readonly icon: "🏥";
    readonly color: "#f43f5e";
}, {
    readonly slug: "internacional";
    readonly name: "Internacional";
    readonly icon: "🌍";
    readonly color: "#64748b";
}, {
    readonly slug: "crypto";
    readonly name: "Crypto & Web3";
    readonly icon: "₿";
    readonly color: "#ffca28";
}, {
    readonly slug: "outros";
    readonly name: "Outros";
    readonly icon: "📌";
    readonly color: "#94a3b8";
}];
