import React, { useState, useEffect } from 'react';
import { Shield, KeyRound, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

export function ResetPinPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            toast.error('Invalid or missing reset token');
            navigate('/login');
        }
    }, [token, navigate]);

    const handlePinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        if (pin.length !== 4 || !/^\d+$/.test(pin)) {
            toast.error('PIN must be exactly 4 digits');
            return;
        }

        if (pin !== confirmPin) {
            toast.error('PINs do not match');
            return;
        }

        setIsLoading(true);
        try {
            await authApi.resetPin(token, pin);
            toast.success('Transaction PIN reset successfully!');
            navigate('/dashboard'); // or back to whatever page they were on
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to reset PIN. Token may be expired.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) return null;

    return (
        <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0F1117] border border-[#1E2535] p-8 rounded-3xl w-full max-w-md relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D084]/10 rounded-bl-full blur-2xl" />

                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-[#161B27] border border-[#1E2535] rounded-2xl flex items-center justify-center shadow-inner">
                        <KeyRound size={32} className="text-[#00D084]" />
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-[#F1F5F9] mb-2">Reset Transaction PIN</h1>
                    <p className="text-[#94A3B8] text-sm">Create a new 4-digit PIN for your financial transactions.</p>
                </div>

                <form onSubmit={handlePinSubmit} className="space-y-6">
                    <div>
                        <label className="block text-[#94A3B8] text-sm mb-2 font-medium">New PIN</label>
                        <div className="relative">
                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569] w-5 h-5" />
                            <input
                                type="password"
                                maxLength={4}
                                required
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                className="w-full bg-[#161B27] border border-[#1E2535] rounded-xl pl-12 pr-4 py-3.5 text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#00D084] transition-colors"
                                placeholder="••••"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[#94A3B8] text-sm mb-2 font-medium">Confirm New PIN</label>
                        <div className="relative">
                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569] w-5 h-5" />
                            <input
                                type="password"
                                maxLength={4}
                                required
                                value={confirmPin}
                                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                                className="w-full bg-[#161B27] border border-[#1E2535] rounded-xl pl-12 pr-4 py-3.5 text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#00D084] transition-colors"
                                placeholder="••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || pin.length !== 4 || confirmPin.length !== 4}
                        className="w-full bg-[#00D084] hover:bg-[#00b872] disabled:opacity-50 text-[#0F1117] font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 group"
                    >
                        {isLoading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <>
                                Reset PIN
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
