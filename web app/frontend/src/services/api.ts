import axios from 'axios';

const API_BASE_URL = (import.meta as unknown as { env: Record<string, string> }).env.VITE_API_URL || 'http://localhost:3333/api';

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
        const isAuthRequest = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/signup');
        if (error.response?.status === 401 && !isAuthRequest) {
            localStorage.removeItem('bizhub_token');
            localStorage.removeItem('bizhub_user');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    },
);

// ─── TYPES ─────────────────────────────────────────────

export interface Product {
    id: string;
    name: string;
    category?: string;
    price: number;
    stock: number;
    minStock?: number;
    description?: string;
    imageUrl?: string;
}

export interface Staff {
    id: string;
    fullName: string;
    email: string;
    role: string;
    phone?: string;
    avatarUrl?: string;
    inviteStatus: 'PENDING' | 'ACCEPTED';
}

export interface SaleItem {
    productId: string;
    quantity: number;
    price?: number;
}

export interface CreateSaleDto {
    items: SaleItem[];
    discount?: number;
    discountType?: 'fixed' | 'percentage';
    paymentMethod: 'cash' | 'card' | 'transfer';
}

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
    changePin: (data: { oldPin: string; newPin: string }) => api.post('/auth/change-pin', data),
    changePassword: (data: { oldPassword: string; newPassword: string }) => api.post('/auth/change-password', data),
    toggle2FA: (enabled: boolean) => api.post('/auth/toggle-2fa', { enabled }),
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
    create: (data: Partial<Staff>) => api.post('/staff', data),
    update: (id: string, data: Partial<Staff>) => api.patch(`/staff/${id}`, data),
    remove: (id: string) => api.delete(`/staff/${id}`),
    pay: (staffId: string, amount: number, reason?: string) =>
        api.post('/staff/pay', { staffId, amount, reason }),
    payAll: (staffIds?: string[], reason?: string) =>
        api.post('/staff/pay-all', { staffIds, reason }),
    payrollHistory: () => api.get('/staff/payroll/history'),
    resendInvite: (staffId: string) => api.post(`/staff/${staffId}/resend-invite`),
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
    getExport: (params?: Record<string, string | number | boolean>) => api.get('/transactions/export', { params }),
    getOne: (id: string) => api.get(`/transactions/${id}`),
    create: (data: Record<string, unknown>) => api.post('/transactions', data),
    sync: () => api.post('/transactions/sync').then(res => res.data),
    remove: (id: string) => api.delete(`/transactions/${id}`),
};

// ─── CAMERAS ──────────────────────────────────────────

export const camerasApi = {
    getAll: () => api.get('/cameras'),
    getOne: (id: string) => api.get(`/cameras/${id}`),
    getStreamConfig: (id: string) => api.get(`/cameras/${id}/stream`),
    create: (data: { name: string; url: string }) => api.post('/cameras', data),
    update: (id: string, data: { name?: string; url?: string }) => api.patch(`/cameras/${id}`, data),
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
    updateProfile: (data: { fullName?: string; phone?: string; avatarUrl?: string }) => api.patch('/settings/profile', data),
    updateBusiness: (data: { name?: string; address?: string; type?: string }) => api.patch('/settings/business', data),
    getPaymentIntegrations: () => api.get('/settings/payments'),
    connectPayment: (data: {
        provider: string;
        publicKey?: string;
        secretKey?: string;
        connected: boolean;
    }) => api.post('/settings/payments/connect', data),
    generateVirtualAccount: () => api.post('/settings/wallet/generate'),
    upgradePlan: (plan: string) => api.post('/settings/wallet/upgrade-plan', { plan }),
    upgradePlanPaystack: (plan: string, isYearly?: boolean) => api.post('/settings/paystack/upgrade-plan', { plan, isYearly }),
    verifyPlanUpgradePaystack: (reference: string) => api.post('/settings/paystack/verify-upgrade', { reference }),
    linkMono: (code: string) => api.post('/settings/mono/link', { code }),
    deleteAccount: (data?: { password?: string }) => api.post('/settings/delete-account', data || {}),
};

// ─── EMAIL ────────────────────────────────────────────

export const emailApi = {
    sendBulk: (data: { subject: string; message: string; staffIds?: string[] }) =>
        api.post('/email/bulk', data),
};

// ─── INVENTORY ────────────────────────────────────────

export const inventoryApi = {
    getProducts: (params?: { search?: string; category?: string; lowStock?: boolean }) =>
        api.get('/inventory/products', { params }),
    getProduct: (id: string) => api.get(`/inventory/products/${id}`),
    createProduct: (data: Partial<Product>) => api.post('/inventory/products', data),
    updateProduct: (id: string, data: Partial<Product>) => api.patch(`/inventory/products/${id}`, data),
    deleteProduct: (id: string) => api.delete(`/inventory/products/${id}`),
    adjustStock: (id: string, data: { type: string; quantityDelta: number; reason?: string }) =>
        api.post(`/inventory/products/${id}/adjust-stock`, data),
    getMovements: (id: string) => api.get(`/inventory/products/${id}/movements`),
    getLowStock: () => api.get('/inventory/products/low-stock'),
    getCategories: () => api.get('/inventory/products/categories'),
    importCSV: (file: File) => {
        const form = new FormData();
        form.append('file', file);
        return api.post('/inventory/import-csv', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
};

// ─── SALES ────────────────────────────────────────────

export const salesApi = {
    createSale: (data: {
        items: { productId: string; quantity: number }[];
        discount?: number;
        discountType?: 'fixed' | 'percentage';
        paymentMethod: 'cash' | 'card' | 'transfer';
    }) => api.post('/sales', data),
    getSales: (params?: { startDate?: string; endDate?: string; paymentMethod?: string; page?: number; limit?: number }) =>
        api.get('/sales', { params }),
    getSale: (id: string) => api.get(`/sales/${id}`),
    getSummary: (params?: { startDate?: string; endDate?: string }) =>
        api.get('/sales/summary', { params }),
};

// ─── RETAIL ANALYTICS ─────────────────────────────────

export const retailAnalyticsApi = {
    getSummary: () => api.get('/retail-analytics/summary'),
    getTopProducts: (limit?: number) => api.get('/retail-analytics/top-products', { params: { limit } }),
    getDailyRevenue: (days?: number) => api.get('/retail-analytics/daily-revenue', { params: { days } }),
    getLowStock: () => api.get('/retail-analytics/low-stock'),
};

// ─── PAYMENTS ─────────────────────────────────────────

export const paymentsApi = {
    getBanks: () => api.get('/payments/banks'),
};

export default api;
