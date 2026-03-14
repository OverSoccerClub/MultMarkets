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
let refreshingPromise: Promise<string> | null = null;

api.interceptors.response.use(
    (r) => r,
    async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;

            // If a refresh is already in progress, wait for it
            if (refreshingPromise) {
                try {
                    const newToken = await refreshingPromise;
                    original.headers.Authorization = `Bearer ${newToken}`;
                    return api(original);
                } catch {
                    return Promise.reject(error);
                }
            }

            // Start a new refresh
            refreshingPromise = (async () => {
                try {
                    const refreshToken = localStorage.getItem('refresh_token');
                    if (!refreshToken) throw new Error('No refresh token');

                    const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
                    
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('access_token', data.accessToken);
                        localStorage.setItem('refresh_token', data.refreshToken);
                        // Sync to cookie for middleware
                        document.cookie = `access_token=${data.accessToken}; path=/; max-age=604800; SameSite=Lax`;
                    }
                    
                    return data.accessToken;
                } finally {
                    refreshingPromise = null;
                }
            })();

            try {
                const newToken = await refreshingPromise;
                original.headers.Authorization = `Bearer ${newToken}`;
                return api(original);
            } catch (err) {
                // Logout and redirect
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                    window.location.href = '/auth/login';
                }
                return Promise.reject(err);
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
    resendVerification: (userId: string) => api.post(`/auth/resend-verification/${userId}`).then((r) => r.data),
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
    create: (data: any) => api.post('/markets', data).then((r) => r.data),
    update: (id: string, data: any) => api.patch(`/markets/${id}`, data).then((r) => r.data),
    delete: (id: string) => api.delete(`/markets/${id}`).then((r) => r.data),
    resolve: (id: string, outcome: 'YES' | 'NO' | 'CANCELLED') => api.post(`/markets/${id}/resolve`, { outcome }).then((r) => r.data),
    getCategories: () => api.get('/markets/categories').then((r) => r.data),
};

export const walletApi = {
    get: () => api.get('/wallet').then((r) => r.data),
    deposit: (amount: number) => api.post('/wallet/deposit', { amount }).then((r) => r.data),
    withdraw: (amount: number, pixKey: string) => api.post('/wallet/withdraw', { amount, pixKey }).then((r) => r.data),
    transactions: (params: { page?: number; limit?: number; type?: string; status?: string; startDate?: string; endDate?: string; id?: string } = {}) => 
        api.get('/wallet/transactions', { params }).then((r) => r.data),
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
    
    // Gateways
    getGateways: () => api.get('/gateways').then(res => res.data),
    createGateway: (data: any) => api.post('/gateways', data).then(res => res.data),
    updateGateway: (id: string, data: any) => api.patch(`/gateways/${id}`, data).then(res => res.data),
    deleteGateway: (id: string) => api.delete(`/gateways/${id}`).then(res => res.data),
    activateGateway: (id: string) => api.patch(`/gateways/${id}/activate`).then(res => res.data),
};

export const financialApi = {
    getTransactions: (params: { page?: number; limit?: number; status?: string; type?: string; startDate?: string; endDate?: string; id?: string }) =>
        api.get('/admin/financial/transactions', { params }).then((r) => r.data),
    approveWithdrawal: (txId: string) => api.patch(`/admin/financial/transactions/${txId}/approve`).then((r) => r.data),
    approveDeposit: (txId: string) => api.patch(`/admin/financial/transactions/${txId}/approve-deposit`).then((r) => r.data),
    rejectWithdrawal: (txId: string, reason?: string) =>
        api.patch(`/admin/financial/transactions/${txId}/reject`, { reason }).then((r) => r.data),
};

