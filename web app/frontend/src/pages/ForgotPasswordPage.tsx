import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await authApi.forgotPassword(email);
            setSent(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send reset email');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen bg-[#0A0E1A] flex items-center justify-center px-4"
            style={{ fontFamily: 'Inter, sans-serif' }}
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D084] to-[#00A868] flex items-center justify-center">
                            <span className="text-white font-black text-lg">B</span>
                        </div>
                        <span className="text-[#F1F5F9] text-2xl font-bold tracking-tight">
                            BizhubNg
                        </span>
                    </div>
                    <p className="text-[#94A3B8] text-sm">
                        Reset your password
                    </p>
                </div>

                <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-8 shadow-2xl">
                    {sent ? (
                        <div className="text-center py-4">
                            <CheckCircle size={48} className="text-[#00D084] mx-auto mb-4" />
                            <h3 className="text-[#F1F5F9] text-lg font-semibold mb-2">
                                Check your email
                            </h3>
                            <p className="text-[#94A3B8] text-sm mb-6">
                                We've sent a password reset link to{' '}
                                <span className="text-[#F1F5F9] font-medium">{email}</span>
                            </p>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 text-[#00D084] text-sm font-semibold hover:underline"
                            >
                                <ArrowLeft size={14} /> Back to Sign In
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-[#94A3B8] text-sm mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail
                                        size={16}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569]"
                                    />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="you@business.com"
                                        className="w-full bg-[#0F1117] border border-[#1E2535] rounded-xl pl-11 pr-4 py-3 text-[#F1F5F9] text-sm placeholder-[#475569] focus:outline-none focus:border-[#00D084] transition-colors"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#00D084] hover:bg-[#00b872] disabled:opacity-50 text-[#0F1117] font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    'Send Reset Link'
                                )}
                            </button>

                            <p className="text-center">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-2 text-[#94A3B8] text-sm hover:text-[#F1F5F9]"
                                >
                                    <ArrowLeft size={14} /> Back to Sign In
                                </Link>
                            </p>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
