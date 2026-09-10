import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
    Eye,
    EyeOff,
    Mail,
    Lock,
    User,
    Building2,
    Phone,
    ArrowRight,
    Loader2,
} from 'lucide-react';

export function SignupPage() {
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        businessName: '',
        businessType: 'Corporate/Workplace',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    const update = (field: string, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (form.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);
        try {
            await signup({
                email: form.email.trim().toLowerCase(),
                password: form.password,
                fullName: form.fullName.trim(),
                phone: form.phone?.trim() || undefined,
                businessName: form.businessName.trim(),
                businessType: form.businessType || undefined,
            });
            navigate('/dashboard');
        } catch (err: any) {
            setError(
                err.response?.data?.message || 'Signup failed. Please try again.',
            );
        } finally {
            setIsLoading(false);
        }
    };

    const isDuplicateEmail =
        error.toLowerCase().includes('already') ||
        error.toLowerCase().includes('exists');

    const inputClass =
        'w-full bg-[#0F1117] border border-[#1E2535] rounded-xl pl-11 pr-4 py-3 text-[#F1F5F9] text-sm placeholder-[#475569] focus:outline-none focus:border-[#00D084] transition-colors';

    return (
        <div
            className="min-h-screen bg-[#0A0E1A] flex items-center justify-center px-4 py-8"
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
                        Create your business account
                    </p>
                    <p className="text-[#475569] text-xs mt-1">
                        Workers? Ask your employer to invite you instead
                    </p>
                </div>

                {/* Card */}
                <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-500/10 border border-red-500/25 rounded-xl p-4 text-red-400 text-sm space-y-2"
                            >
                                <p className="font-medium text-red-300">{error}</p>
                                {isDuplicateEmail && (
                                    <div className="pt-2 border-t border-red-500/20 flex items-center justify-between text-xs">
                                        <span className="text-[#94A3B8]">Already have an account?</span>
                                        <Link
                                            to="/login"
                                            className="text-[#00D084] font-semibold hover:underline"
                                        >
                                            Sign In instead &rarr;
                                        </Link>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Full Name */}
                        <div>
                            <label className="block text-[#94A3B8] text-sm mb-1.5">
                                Full Name
                            </label>
                            <div className="relative">
                                <User
                                    size={16}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569]"
                                />
                                <input
                                    type="text"
                                    value={form.fullName}
                                    onChange={(e) => update('fullName', e.target.value)}
                                    required
                                    placeholder="Emeka Okafor"
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-[#94A3B8] text-sm mb-1.5">
                                Email
                            </label>
                            <div className="relative">
                                <Mail
                                    size={16}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569]"
                                />
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => update('email', e.target.value)}
                                    required
                                    placeholder="you@business.com"
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-[#94A3B8] text-sm mb-1.5">
                                Phone (optional)
                            </label>
                            <div className="relative">
                                <Phone
                                    size={16}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569]"
                                />
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => update('phone', e.target.value)}
                                    placeholder="+234 801 234 5678"
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-[#94A3B8] text-sm mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <Lock
                                    size={16}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569]"
                                />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={(e) => update('password', e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-[#0F1117] border border-[#1E2535] rounded-xl pl-11 pr-12 py-3 text-[#F1F5F9] text-sm placeholder-[#475569] focus:outline-none focus:border-[#00D084] transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#94A3B8]"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-[#94A3B8] text-sm mb-1.5">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock
                                    size={16}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569]"
                                />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.confirmPassword}
                                    onChange={(e) => update('confirmPassword', e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-3 pt-2">
                            <div className="flex-1 h-px bg-[#1E2535]" />
                            <span className="text-[#475569] text-xs">Business Info</span>
                            <div className="flex-1 h-px bg-[#1E2535]" />
                        </div>

                        {/* Business Name */}
                        <div>
                            <label className="block text-[#94A3B8] text-sm mb-1.5">
                                Business Name
                            </label>
                            <div className="relative">
                                <Building2
                                    size={16}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569]"
                                />
                                <input
                                    type="text"
                                    value={form.businessName}
                                    onChange={(e) => update('businessName', e.target.value)}
                                    required
                                    placeholder="Okafor Enterprises Ltd"
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* Business Type */}
                        <div>
                            <label className="block text-[#94A3B8] text-sm mb-1.5">
                                Business Type *
                            </label>
                            <select
                                value={form.businessType}
                                onChange={(e) => update('businessType', e.target.value)}
                                required
                                className="w-full bg-[#0F1117] border border-[#1E2535] rounded-xl px-4 py-3 text-[#F1F5F9] text-sm focus:outline-none focus:border-[#00D084] transition-colors"
                            >
                                <option value="">Select type...</option>
                                <option value="Corporate/Workplace">Corporate/Workplace</option>
                                <option value="Retail/Storefront">Retail/Storefront</option>
                            </select>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#00D084] hover:bg-[#00b872] disabled:opacity-50 text-[#0F1117] font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
                        >
                            {isLoading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    Create Account <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>



                    {/* Login link */}
                    <p className="text-center text-[#94A3B8] text-sm mt-6">
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            className="text-[#00D084] font-semibold hover:underline"
                        >
                            Sign In
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
