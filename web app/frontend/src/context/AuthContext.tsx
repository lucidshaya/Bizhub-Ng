import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { authApi, settingsApi } from '../services/api';

interface User {
    id: string;
    email: string;
    fullName: string;
    role: string;
    avatarUrl?: string;
    businessId?: string;
    businessName?: string;
    businessType?: string;
    businessPlan?: string;
    storeMode?: 'WORKSPACE' | 'RETAIL_STORE';
    trialActivated?: boolean;
    hasPin?: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (data: {
        email: string;
        password: string;
        fullName: string;
        phone?: string;
        businessName: string;
        businessType?: string;
    }) => Promise<void>;
    googleLogin: () => Promise<void>;
    logout: () => Promise<void>;
    deleteAccount: (password?: string) => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const saveAuth = (userData: User, authToken: string) => {
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('bizhub_token', authToken);
        localStorage.setItem('bizhub_user', JSON.stringify(userData));
    };

    const clearAuth = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('bizhub_token');
        localStorage.removeItem('bizhub_user');
    };

    // Load stored auth on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('bizhub_token');
        const storedUser = localStorage.getItem('bizhub_user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);

        // Listen for Supabase auth changes (for Google OAuth callback)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    // This fires after Google OAuth redirect
                    const sbUser = session.user;
                    const meta = sbUser.user_metadata || {};

                    // Try to sync with backend
                    try {
                        localStorage.setItem('bizhub_token', session.access_token);
                        let backendUser: any;

                        try {
                            const res = await authApi.getProfile();
                            backendUser = res.data;
                        } catch {
                            // First-time Google user — register in backend
                            try {
                                const res = await authApi.signup({
                                    email: sbUser.email!,
                                    password: crypto.randomUUID(),
                                    fullName: meta.full_name || meta.name || sbUser.email?.split('@')[0] || 'User',
                                    businessName: `${meta.full_name || 'My'}'s Business`,
                                });
                                backendUser = res.data.user;
                            } catch {
                                backendUser = null;
                            }
                        }

                        const appUser: User = {
                            id: backendUser?.id || sbUser.id,
                            email: backendUser?.email || sbUser.email || '',
                            fullName: backendUser?.fullName || meta.full_name || meta.name || 'User',
                            role: backendUser?.role || 'OWNER',
                            avatarUrl: backendUser?.avatarUrl || meta.avatar_url,
                            businessId: backendUser?.businessId,
                            businessName: backendUser?.businessName,
                            businessType: backendUser?.businessType,
                            businessPlan: backendUser?.businessPlan,
                            storeMode: backendUser?.storeMode,
                        };

                        saveAuth(appUser, session.access_token);
                    } catch {
                        // Fallback
                        saveAuth({
                            id: sbUser.id,
                            email: sbUser.email || '',
                            fullName: meta.full_name || 'User',
                            role: 'OWNER',
                        }, session.access_token);
                    }
                }
            },
        );

        return () => subscription.unsubscribe();
    }, []);

    // ─── LOGIN (via Backend API) ────────────────────────

    const login = async (email: string, password: string) => {
        const res = await authApi.login({ email, password });
        saveAuth(res.data.user, res.data.token);
    };

    // ─── SIGNUP (via Backend API) ───────────────────────

    const signup = async (data: {
        email: string;
        password: string;
        fullName: string;
        phone?: string;
        businessName: string;
        businessType?: string;
    }) => {
        const res = await authApi.signup(data);
        saveAuth(res.data.user, res.data.token);
    };

    // ─── GOOGLE LOGIN (via Supabase OAuth) ──────────────

    const googleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) throw new Error(error.message);
    };

    // ─── LOGOUT ─────────────────────────────────────────

    const logout = async () => {
        try { await supabase.auth.signOut(); } catch { /* ignore */ }
        clearAuth();
    };

    // ─── DELETE ACCOUNT ──────────────────────────────────

    const deleteAccount = async (password?: string) => {
        await settingsApi.deleteAccount({ password });
        try { await supabase.auth.signOut(); } catch { /* ignore */ }
        clearAuth();
    };

    // ─── REFRESH PROFILE ────────────────────────────────

    const refreshProfile = async () => {
        try {
            const res = await authApi.getProfile();
            const updatedUser = { ...user, ...res.data } as User;
            setUser(updatedUser);
            localStorage.setItem('bizhub_user', JSON.stringify(updatedUser));
        } catch {
            await logout();
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                isAuthenticated: !!user && !!token,
                login,
                signup,
                googleLogin,
                logout,
                deleteAccount,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
