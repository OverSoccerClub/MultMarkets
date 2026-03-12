// apps/web/lib/api.ts
// Centralized Axios instance with auth token injection

import axios from 'axios';

const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
};

const API_URL = getApiUrl();

export const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Attach access token on every request
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
    (r) => r,
    async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;
            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) throw new Error('No refresh token');

                const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
                localStorage.setItem('access_token', data.accessToken);
                localStorage.setItem('refresh_token', data.refreshToken);
                original.headers.Authorization = `Bearer ${data.accessToken}`;
                return api(original);
            } catch {
                // Logout
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/auth/login';
            }
        }
        return Promise.reject(error);
    },
);

// ── API helpers ───────────────────────────────────────────────────────

export const authApi = {
    register: (data: any) => api.post('/auth/register', data).then((r) => r.data),
    login: (data: any) => api.post('/auth/login', data).then((r) => r.data),
    verifyKyc: (data: any) => api.post('/auth/verify-kyc', data).then((r) => r.data),
    refresh: (token: string) => api.post('/auth/refresh', { refreshToken: token }).then((r) => r.data),
    logout: () => api.post('/auth/logout').then((r) => r.data),
    me: () => api.get('/auth/me').then((r) => r.data),
    updateProfile: (data: any) => api.patch('/auth/profile', data).then((r) => r.data),
    verifyEmail: (token: string) => api.post(`/auth/verify-email/${token}`).then((r) => r.data),
    forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }).then((r) => r.data),
    resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }).then((r) => r.data),
    setup2fa: () => api.get('/auth/2fa/setup').then((r) => r.data),
    enable2fa: (code: string) => api.post('/auth/2fa/enable', { code }).then((r) => r.data),
    disable2fa: (code: string) => api.post('/auth/2fa/disable', { code }).then((r) => r.data),
};

export const marketsApi = {
    list: (params?: any) => api.get('/markets', { params }).then((r) => r.data),
    trending: (limit = 10) => api.get('/markets/trending', { params: { limit } }).then((r) => r.data),
    detail: (slug: string) => api.get(`/markets/${slug}`).then((r) => r.data),
    history: (id: string, period = '24h') => api.get(`/markets/${id}/history`, { params: { period } }).then((r) => r.data),
};

export const walletApi = {
    get: () => api.get('/wallet').then((r) => r.data),
    deposit: (amount: number) => api.post('/wallet/deposit', { amount }).then((r) => r.data),
    withdraw: (amount: number, pixKey: string) => api.post('/wallet/withdraw', { amount, pixKey }).then((r) => r.data),
    transactions: (page = 1, limit = 20) => api.get('/wallet/transactions', { params: { page, limit } }).then((r) => r.data),
};

export const tradingApi = {
    preview: (data: any) => api.post('/trading/preview', data).then((r) => r.data),
    execute: (data: any) => api.post('/trading/execute', data).then((r) => r.data),
    positions: () => api.get('/trading/positions').then((r) => r.data),
};

export const botApi = {
    // Drafts
    getDrafts: (params?: any) => api.get('/bot/drafts', { params }).then((r) => r.data),
    approveDraft: (id: string, data: any) => api.post(`/bot/drafts/${id}/approve`, data).then((r) => r.data),
    rejectDraft: (id: string, data: any = {}) => api.post(`/bot/drafts/${id}/reject`, data).then((r) => r.data),

    // Sources
    getSources: () => api.get('/bot/sources').then((r) => r.data),
    createSource: (data: any) => api.post('/bot/sources', data).then((r) => r.data),
    updateSource: (id: string, data: any) => api.patch(`/bot/sources/${id}`, data).then((r) => r.data),
    deleteSource: (id: string) => api.post(`/bot/sources/${id}/delete`).then((r) => r.data),

    // Topics
    getTopics: (params?: any) => api.get('/bot/topics', { params }).then((r) => r.data),

    // System
    runCycle: () => api.post('/bot/run').then((r) => r.data),
};

export const pixApi = {
    deposit: (amount: number) => api.post('/pix/deposit', { amount }).then((r) => r.data),
    withdraw: (amount: number) => api.post('/pix/withdraw', { amount }).then((r) => r.data),
    status: (txId: string) => api.get(`/pix/status/${txId}`).then((r) => r.data),
    transactions: (page = 1, limit = 20) => api.get('/pix/transactions', { params: { page, limit } }).then((r) => r.data),
};

export const adminApi = {
    getSettings: () => api.get('/settings').then((r) => r.data),
    updateSettings: (settings: { key: string; value: string; description?: string; isSecret?: boolean }[]) =>
        api.put('/settings', settings).then((r) => r.data),
};

