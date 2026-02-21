import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ShieldCheck, Loader2, X } from 'lucide-react';
import { authApi } from '../../services/api';
import { useToast } from './Toast';

interface PinSetupModalProps {
    isOpen: boolean;
    onComplete: () => void;
    onClose?: () => void;
}

export function PinSetupModal({ isOpen, onComplete, onClose }: PinSetupModalProps) {
    const toast = useToast();
    const [step, setStep] = useState<'enter' | 'confirm'>('enter');
    const [pin, setPin] = useState(['', '', '', '']);
    const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const inputRefs = [
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
    ];
    const confirmRefs = [
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
    ];

    useEffect(() => {
        if (isOpen && step === 'enter') {
            setTimeout(() => inputRefs[0].current?.focus(), 100);
        }
    }, [isOpen, step]);

    const handleInput = (
        value: string,
        index: number,
        currentPin: string[],
        setter: (p: string[]) => void,
        refs: React.RefObject<HTMLInputElement | null>[],
    ) => {
        if (!/^\d?$/.test(value)) return;
        const next = [...currentPin];
        next[index] = value;
        setter(next);
        setError('');

        if (value && index < 3) {
            refs[index + 1].current?.focus();
        }
    };

    const handleKeyDown = (
        e: React.KeyboardEvent,
        index: number,
        currentPin: string[],
        setter: (p: string[]) => void,
        refs: React.RefObject<HTMLInputElement | null>[],
    ) => {
        if (e.key === 'Backspace' && !currentPin[index] && index > 0) {
            refs[index - 1].current?.focus();
            const next = [...currentPin];
            next[index - 1] = '';
            setter(next);
        }
    };

    const handleContinue = () => {
        const pinStr = pin.join('');
        if (pinStr.length !== 4) {
            setError('Enter all 4 digits');
            return;
        }
        setStep('confirm');
        setTimeout(() => confirmRefs[0].current?.focus(), 100);
    };

    const handleSubmit = async () => {
        const pinStr = pin.join('');
        const confirmStr = confirmPin.join('');

        if (confirmStr.length !== 4) {
            setError('Enter all 4 digits');
            return;
        }
        if (pinStr !== confirmStr) {
            setError('PINs do not match');
            setConfirmPin(['', '', '', '']);
            setTimeout(() => confirmRefs[0].current?.focus(), 100);
            return;
        }

        setIsSaving(true);
        try {
            await authApi.setPin(pinStr);
            toast.success('Transaction PIN set successfully!');
            onComplete();
        } catch {
            toast.error('Failed to set PIN. Try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const renderPinInputs = (
        currentPin: string[],
        setter: (p: string[]) => void,
        refs: React.RefObject<HTMLInputElement | null>[],
    ) => (
        <div className="flex gap-3 justify-center">
            {[0, 1, 2, 3].map((i) => (
                <input
                    key={i}
                    ref={refs[i]}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={currentPin[i]}
                    onChange={(e) => handleInput(e.target.value, i, currentPin, setter, refs)}
                    onKeyDown={(e) => handleKeyDown(e, i, currentPin, setter, refs)}
                    className="w-14 h-14 text-center text-2xl font-bold bg-[#0F1117] border-2 border-[#1E2535] rounded-xl text-[#F1F5F9] focus:outline-none focus:border-[#00D084] transition-colors"
                />
            ))}
        </div>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25 }}
                        className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-8 w-full max-w-sm text-center"
                    >
                        {onClose && (
                            <div className="flex justify-end -mt-2 -mr-2 mb-2">
                                <button onClick={onClose} className="text-[#94A3B8] hover:text-[#F1F5F9] transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                        )}

                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#00D084] to-[#3B82F6] flex items-center justify-center">
                            {step === 'enter' ? <Lock size={28} className="text-white" /> : <ShieldCheck size={28} className="text-white" />}
                        </div>

                        <h3 className="text-[#F1F5F9] text-lg font-bold mb-1">
                            {step === 'enter' ? 'Set Transaction PIN' : 'Confirm Your PIN'}
                        </h3>
                        <p className="text-[#94A3B8] text-sm mb-6">
                            {step === 'enter'
                                ? 'Create a 4-digit PIN to authorize transactions'
                                : 'Re-enter your PIN to confirm'}
                        </p>

                        {step === 'enter'
                            ? renderPinInputs(pin, setPin, inputRefs)
                            : renderPinInputs(confirmPin, setConfirmPin, confirmRefs)
                        }

                        {error && (
                            <p className="text-[#EF4444] text-xs mt-3 font-medium">{error}</p>
                        )}

                        <button
                            onClick={step === 'enter' ? handleContinue : handleSubmit}
                            disabled={isSaving}
                            className="w-full mt-6 bg-[#00D084] hover:bg-[#00b872] disabled:opacity-50 text-[#0F1117] font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : step === 'enter' ? 'Continue' : 'Set PIN'}
                        </button>

                        {step === 'confirm' && (
                            <button
                                onClick={() => { setStep('enter'); setConfirmPin(['', '', '', '']); setError(''); }}
                                className="mt-3 text-[#94A3B8] hover:text-[#F1F5F9] text-sm transition-colors"
                            >
                                Back
                            </button>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
