import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('bizhub_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 responses (redirect to login)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('bizhub_token');
            localStorage.removeItem('bizhub_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    },
);

// ─── AUTH ──────────────────────────────────────────────

export const authApi = {
    signup: (data: {
        email: string;
        password: string;
        fullName: string;
        phone?: string;
        businessName: string;
        businessType?: string;
        businessAddress?: string;
    }) => api.post('/auth/signup', data),

    login: (data: { email: string; password: string }) =>
        api.post('/auth/login', data),

    googleAuth: (idToken: string) =>
        api.post('/auth/google', { idToken }),

    forgotPassword: (email: string) =>
        api.post('/auth/forgot-password', { email }),

    getProfile: () => api.get('/auth/profile'),

    inviteWorker: (data: { name: string; email: string; role?: string; phone?: string }) =>
        api.post('/auth/invite-worker', data),

    setPin: (pin: string) => api.post('/auth/set-pin', { pin }),
    verifyPin: (pin: string) => api.post('/auth/verify-pin', { pin }),
    requestPinReset: () => api.post('/auth/request-pin-reset'),
    resetPin: (token: string, pin: string) => api.post('/auth/reset-pin', { token, pin }),
};

// ─── DASHBOARD ────────────────────────────────────────

export const dashboardApi = {
    getSummary: () => api.get('/dashboard/summary'),
    getActivity: () => api.get('/dashboard/activity'),
    verifyFunding: (reference: string) => api.post('/payments/paystack/verify-funding', { reference }),
};

// ─── STAFF ────────────────────────────────────────────

export const staffApi = {
    getAll: () => api.get('/staff'),
    getOne: (id: string) => api.get(`/staff/${id}`),
    create: (data: any) => api.post('/staff', data),
    update: (id: string, data: any) => api.patch(`/staff/${id}`, data),
    remove: (id: string) => api.delete(`/staff/${id}`),
    pay: (staffId: string, amount: number, reason?: string) =>
        api.post('/staff/pay', { staffId, amount, reason }),
    payAll: (staffIds?: string[], reason?: string) =>
        api.post('/staff/pay-all', { staffIds, reason }),
    payrollHistory: () => api.get('/staff/payroll/history'),
};

// ─── TRANSACTIONS ─────────────────────────────────────

export const transactionsApi = {
    getAll: (params?: {
        type?: string;
        status?: string;
        channel?: string;
        search?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
    }) => api.get('/transactions', { params }),
    getSummary: () => api.get('/transactions/summary'),
    getExport: (params?: any) => api.get('/transactions/export', { params }),
    getOne: (id: string) => api.get(`/transactions/${id}`),
    create: (data: any) => api.post('/transactions', data),
    sync: () => api.post('/transactions/sync').then(res => res.data),
    remove: (id: string) => api.delete(`/transactions/${id}`),
};

// ─── CAMERAS ──────────────────────────────────────────

export const camerasApi = {
    getAll: () => api.get('/cameras'),
    getOne: (id: string) => api.get(`/cameras/${id}`),
    getStreamConfig: (id: string) => api.get(`/cameras/${id}/stream`),
    create: (data: any) => api.post('/cameras', data),
    update: (id: string, data: any) => api.patch(`/cameras/${id}`, data),
    remove: (id: string) => api.delete(`/cameras/${id}`),
};

// ─── CHAT ─────────────────────────────────────────────

export const chatApi = {
    getRooms: () => api.get('/chat/rooms'),
    getUsers: () => api.get('/chat/users'),
    getMessages: (roomId: string) => api.get(`/chat/rooms/${roomId}/messages`),
    createRoom: (data: { name?: string; type: string; memberIds: string[] }) =>
        api.post('/chat/rooms', data),
    sendMessage: (roomId: string, text: string) =>
        api.post('/chat/messages', { roomId, text }),
};

// ─── SETTINGS ─────────────────────────────────────────

export const settingsApi = {
    getProfile: () => api.get('/settings/profile'),
    updateProfile: (data: any) => api.patch('/settings/profile', data),
    updateBusiness: (data: any) => api.patch('/settings/business', data),
    getPaymentIntegrations: () => api.get('/settings/payments'),
    connectPayment: (data: {
        provider: string;
        publicKey?: string;
        secretKey?: string;
        connected: boolean;
    }) => api.post('/settings/payments/connect', data),
    generateVirtualAccount: () => api.post('/settings/wallet/generate'),
    upgradePlan: (plan: string) => api.post('/settings/wallet/upgrade-plan', { plan }),
    upgradePlanPaystack: (plan: string) => api.post('/settings/paystack/upgrade-plan', { plan }),
};

// ─── EMAIL ────────────────────────────────────────────

export const emailApi = {
    sendBulk: (data: { subject: string; message: string; staffIds?: string[] }) =>
        api.post('/email/bulk', data),
};

export default api;
