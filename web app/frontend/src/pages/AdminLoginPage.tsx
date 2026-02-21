import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ADMIN_EMAIL = 'ohinegames@gmail.com';
const ADMIN_PASS = 'ugoreX52';

export function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [obscure, setObscure] = useState(true);
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        setTimeout(() => {
            if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
                localStorage.setItem('bizhub_admin', JSON.stringify({ email, role: 'ADMIN' }));
                navigate('/admin/dashboard');
            } else {
                setError('Invalid admin credentials');
            }
            setLoading(false);
        }, 500);
    };

    return (
        <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                        style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}>
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-[#F1F5F9]">BizhubNg Admin</h1>
                    <p className="text-[#94A3B8] text-sm mt-1">Customer Support Dashboard</p>
                </div>

                {/* Login Card */}
                <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-6">
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl p-3 mb-4">
                                {error}
                            </div>
                        )}

                        <label className="block text-[#94A3B8] text-xs font-medium mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@bizhubng.com"
                            className="w-full bg-[#0F1117] border border-[#1E2535] rounded-xl px-4 py-3 text-sm text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-red-500 mb-4"
                        />

                        <label className="block text-[#94A3B8] text-xs font-medium mb-1">Password</label>
                        <div className="relative mb-6">
                            <input
                                type={obscure ? 'password' : 'text'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-[#0F1117] border border-[#1E2535] rounded-xl px-4 py-3 text-sm text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-red-500 pr-10"
                            />
                            <button type="button" onClick={() => setObscure(!obscure)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569]">
                                {obscure ? '👁' : '🔒'}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !email || !password}
                            className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', color: '#fff' }}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    🔐 Admin Sign In
                                </span>
                            )}
                        </button>
                    </form>

                    <div className="mt-4 pt-4 border-t border-[#1E2535] text-center">
                        <a href="/" className="text-[#94A3B8] text-xs hover:text-[#F1F5F9] transition-colors">
                            ← Back to BizhubNg
                        </a>
                    </div>
                </div>

                <p className="text-[#475569] text-xs text-center mt-4">
                    Restricted access · BizhubNg Support Team Only
                </p>
            </div>
        </div>
    );
}
