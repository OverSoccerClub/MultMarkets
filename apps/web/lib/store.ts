// apps/web/lib/store.ts
// Zustand global state stores

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Auth Store ────────────────────────────────────────────────────────
interface User {
    id: string;
    email: string;
    name: string;
    username: string;
    avatarUrl: string | null;
    role: string;
    emailVerified: boolean;
    twoFactorEnabled: boolean;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    setTokens: (accessToken: string, refreshToken: string) => void;
    setUser: (user: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            setTokens: (accessToken, refreshToken) => {
                if (typeof window !== 'undefined') {
                    localStorage.setItem('access_token', accessToken);
                    localStorage.setItem('refresh_token', refreshToken);
                }
                set({ accessToken, refreshToken, isAuthenticated: true });
            },
            setUser: (user) => set({ user }),
            logout: () => {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                }
                set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
            },
        }),
        { name: 'multmarkets-auth', partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken, isAuthenticated: s.isAuthenticated }) },
    ),
);

// ── Wallet Store ──────────────────────────────────────────────────────
interface WalletState {
    balance: number;
    lockedBalance: number;
    available: number;
    currency: string;
    setWallet: (data: Partial<WalletState>) => void;
}

export const useWalletStore = create<WalletState>()((set) => ({
    balance: 0,
    lockedBalance: 0,
    available: 0,
    currency: 'BRL',
    setWallet: (data) => set((s) => ({ ...s, ...data })),
}));

// ── UI Store ──────────────────────────────────────────────────────────
interface UiState {
    betPanelOpen: boolean;
    betPanelMarketId: string | null;
    betPanelSide: 'YES' | 'NO' | null;
    openBetPanel: (marketId: string, side: 'YES' | 'NO') => void;
    closeBetPanel: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
    betPanelOpen: false,
    betPanelMarketId: null,
    betPanelSide: null,
    openBetPanel: (marketId, side) => set({ betPanelOpen: true, betPanelMarketId: marketId, betPanelSide: side }),
    closeBetPanel: () => set({ betPanelOpen: false, betPanelMarketId: null, betPanelSide: null }),
}));
