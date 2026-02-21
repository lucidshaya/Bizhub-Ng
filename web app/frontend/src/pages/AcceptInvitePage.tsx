import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2, CheckCircle, Building2 } from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';

export function AcceptInvitePage() {
    const [searchParams] = useSearchParams();
    const inviteToken = searchParams.get('token') || '';
    const navigate = useNavigate();

    const [inviteInfo, setInviteInfo] = useState<{ email: string; fullName: string; businessName: string } | null>(null);
    const [loadingInfo, setLoadingInfo] = useState(true);
    const [infoError, setInfoError] = useState('');

    const [form, setForm] = useState({ fullName: '', phone: '', password: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Fetch invite info on load
    useEffect(() => {
        if (!inviteToken) {
            setLoadingInfo(false);
            return;
        }

        const fetchInviteInfo = async () => {
            try {
                const res = await axios.get(`${API}/auth/invite-info?token=${inviteToken}`);
                setInviteInfo(res.data);
                // Pre-fill name from invite if available
                if (res.data.fullName) {
                    setForm(prev => ({ ...prev, fullName: res.data.fullName }));
                }
            } catch (err: any) {
                setInfoError(err.response?.data?.message || 'Invalid or expired invitation');
            } finally {
                setLoadingInfo(false);
            }
        };

        fetchInviteInfo();
    }, [inviteToken]);

    const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (form.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);
        try {
            const res = await axios.post(`${API}/auth/accept-invite`, {
                token: inviteToken,
                password: form.password,
                fullName: form.fullName || inviteInfo?.fullName || 'Worker',
                phone: form.phone || undefined,
            });

            // Save auth
            localStorage.setItem('bizhub_token', res.data.token);
            localStorage.setItem('bizhub_user', JSON.stringify(res.data.user));
            setSuccess(true);

            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid or expired invitation');
        } finally {
            setIsLoading(false);
        }
    };


    if (!inviteToken) {
        return (
            <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="text-4xl mb-4">⚠️</div>
                    <h2 className="text-[#F1F5F9] text-xl font-bold mb-2">Invalid Invitation</h2>
                    <p className="text-[#94A3B8] text-sm mb-4">No invitation token found. Please check your email for the correct link.</p>
                    <Link to="/login" className="text-[#00D084] font-semibold hover:underline">Go to Login</Link>
                </div>
            </div>
        );
    }

    if (loadingInfo) {
        return (
            <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center px-4">
                <div className="text-center">
                    <Loader2 size={40} className="text-[#00D084] animate-spin mx-auto mb-4" />
                    <p className="text-[#94A3B8] text-sm">Loading invitation details...</p>
                </div>
            </div>
        );
    }

    if (infoError) {
        return (
            <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="text-4xl mb-4">❌</div>
                    <h2 className="text-[#F1F5F9] text-xl font-bold mb-2">Invitation Error</h2>
                    <p className="text-[#94A3B8] text-sm mb-4">{infoError}</p>
                    <Link to="/login" className="text-[#00D084] font-semibold hover:underline">Go to Login</Link>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center px-4">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                    <CheckCircle size={64} className="text-[#00D084] mx-auto mb-4" />
                    <h2 className="text-[#F1F5F9] text-xl font-bold mb-2">Welcome to the team! 🎉</h2>
                    <p className="text-[#94A3B8] text-sm">Redirecting you to the dashboard...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center px-4 py-8" style={{ fontFamily: 'Inter, sans-serif' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D084] to-[#00A868] flex items-center justify-center">
                            <span className="text-white font-black text-lg">B</span>
                        </div>
                        <span className="text-[#F1F5F9] text-2xl font-bold tracking-tight">BizhubNg</span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#F1F5F9] mb-2">Worker Sign In</h1>
                    <p className="text-[#94A3B8] text-sm">
                        You're joining <strong className="text-[#00D084]">{inviteInfo?.businessName}</strong>
                    </p>
                    <p className="text-[#475569] text-xs mt-1">Set your password to accept the invitation</p>
                </div>

                {/* Card */}
                <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                                {error}
                            </motion.div>
                        )}

                        {/* Email (read-only, pre-filled) */}
                        <div>
                            <label className="block text-[#94A3B8] text-sm mb-1.5">Email</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569]" />
                                <input type="email" value={inviteInfo?.email || ''} readOnly
                                    className="w-full bg-[#0A0E1A] border border-[#1E2535] rounded-xl pl-11 pr-4 py-3 text-[#00D084] text-sm font-medium cursor-not-allowed focus:outline-none"
                                />
                            </div>
                            <p className="text-[#475569] text-xs mt-1">This is the email your invitation was sent to</p>
                        </div>

                        {/* Hidden Name & Phone fields removed from UI for simplicity */}

                        {/* Password */}
                        <div>
                            <label className="block text-[#94A3B8] text-sm mb-1.5">Create Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569]" />
                                <input type={showPassword ? 'text' : 'password'} value={form.password}
                                    onChange={(e) => update('password', e.target.value)} required placeholder="••••••••"
                                    className="w-full bg-[#0F1117] border border-[#1E2535] rounded-xl pl-11 pr-12 py-3 text-[#F1F5F9] text-sm placeholder-[#475569] focus:outline-none focus:border-[#00D084] transition-colors" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#94A3B8]">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password Removed */}

                        {/* Business info badge */}
                        <div className="flex items-center gap-2 bg-[#00D084]/10 border border-[#00D084]/20 rounded-xl px-4 py-3">
                            <Building2 size={16} className="text-[#00D084]" />
                            <span className="text-[#00D084] text-sm font-medium">
                                You'll join {inviteInfo?.businessName} as a staff member
                            </span>
                        </div>

                        <button type="submit" disabled={isLoading}
                            className="w-full bg-[#00D084] hover:bg-[#00b872] disabled:opacity-50 text-[#0F1117] font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2">
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <>Join Team <ArrowRight size={16} /></>}
                        </button>
                    </form>

                    <p className="text-center text-[#94A3B8] text-sm mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="text-[#00D084] font-semibold hover:underline">Sign In</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
