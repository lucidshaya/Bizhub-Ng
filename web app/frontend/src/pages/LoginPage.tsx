import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, Building2, HardHat } from 'lucide-react';
import { useToast } from '../components/web/Toast';

type LoginRole = 'business' | 'worker';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loginRole, setLoginRole] = useState<LoginRole>('business');
    const { login } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || 'Invalid email or password';
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };



    return (
        <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center px-4" style={{ fontFamily: 'Inter, sans-serif' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D084] to-[#00A868] flex items-center justify-center">
                            <span className="text-white font-black text-lg">B</span>
                        </div>
                        <span className="text-[#F1F5F9] text-2xl font-bold tracking-tight">BizhubNg</span>
                    </div>
                    <p className="text-[#94A3B8] text-sm">Sign in to manage your business</p>
                </div>

                {/* Role Toggle */}
                <div className="flex bg-[#161B27] border border-[#1E2535] rounded-xl p-1 mb-6">
                    <button
                        onClick={() => setLoginRole('business')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${loginRole === 'business'
                            ? 'bg-[#00D084] text-[#0F1117]'
                            : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                            }`}
                    >
                        <Building2 size={16} />
                        Business Owner
                    </button>
                    <button
                        onClick={() => setLoginRole('worker')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${loginRole === 'worker'
                            ? 'bg-[#3B82F6] text-white'
                            : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                            }`}
                    >
                        <HardHat size={16} />
                        Worker
                    </button>
                </div>

                {/* Card */}
                <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-8 shadow-2xl">
                    {loginRole === 'worker' && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 mb-5">
                            <p className="text-blue-400 text-sm">
                                <strong>Worker Login:</strong> Sign in with the email your employer used to invite you.
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-[#94A3B8] text-sm mb-2">Email</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569]" />
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                    required autoComplete="email" placeholder={loginRole === 'worker' ? 'worker@email.com' : 'you@business.com'}
                                    className="w-full bg-[#0F1117] border border-[#1E2535] rounded-xl pl-11 pr-4 py-3 text-[#F1F5F9] text-sm placeholder-[#475569] focus:outline-none focus:border-[#00D084] transition-colors" />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[#94A3B8] text-sm">Password</label>
                                <Link to="/forgot-password" className="text-[#00D084] text-xs hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569]" />
                                <input type={showPassword ? 'text' : 'password'} value={password}
                                    onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" placeholder="••••••••"
                                    className="w-full bg-[#0F1117] border border-[#1E2535] rounded-xl pl-11 pr-12 py-3 text-[#F1F5F9] text-sm placeholder-[#475569] focus:outline-none focus:border-[#00D084] transition-colors" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#94A3B8]">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button type="submit" disabled={isLoading}
                            className={`w-full ${loginRole === 'worker' ? 'bg-[#3B82F6] hover:bg-[#2563EB]' : 'bg-[#00D084] hover:bg-[#00b872]'} disabled:opacity-50 text-${loginRole === 'worker' ? 'white' : '[#0F1117]'} font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2`}>
                            {isLoading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    {loginRole === 'worker' ? 'Sign In as Worker' : 'Sign In'} <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>



                    {/* Sign up link */}
                    <p className="text-center text-[#94A3B8] text-sm mt-6">
                        {loginRole === 'worker' ? (
                            <>
                                Don't have an invitation?{' '}
                                <span className="text-[#475569]">Ask your employer to invite you</span>
                            </>
                        ) : (
                            <>
                                Don't have an account?{' '}
                                <Link to="/signup" className="text-[#00D084] font-semibold hover:underline">
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
