import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType, duration?: number) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast(): ToastContextType {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}

const typeConfig: Record<ToastType, {
    label: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
    border: string;
}> = {
    success: {
        label: 'SUCCESS',
        icon: <CheckCircle2 size={14} />,
        color: '#00D084',
        bg: 'bg-[#00D084]/15 text-[#00D084]',
        border: 'border-[#00D084]/30',
    },
    error: {
        label: 'ERROR',
        icon: <XCircle size={14} />,
        color: '#EF4444',
        bg: 'bg-[#EF4444]/15 text-[#EF4444]',
        border: 'border-[#EF4444]/30',
    },
    warning: {
        label: 'WARNING',
        icon: <AlertTriangle size={14} />,
        color: '#F59E0B',
        bg: 'bg-[#F59E0B]/15 text-[#F59E0B]',
        border: 'border-[#F59E0B]/30',
    },
    info: {
        label: 'NOTIFICATION',
        icon: <Info size={14} />,
        color: '#3B82F6',
        bg: 'bg-[#3B82F6]/15 text-[#3B82F6]',
        border: 'border-[#3B82F6]/30',
    },
};

const ToastItem = React.forwardRef<
    HTMLDivElement,
    { toast: Toast; onDismiss: (id: string) => void }
>(({ toast: t, onDismiss }, ref) => {
    const duration = t.duration || 4000;
    const [progress, setProgress] = useState(100);
    const startTime = useRef(Date.now());
    const rafRef = useRef<number>();
    const cfg = typeConfig[t.type];

    useEffect(() => {
        const tick = () => {
            const elapsed = Date.now() - startTime.current;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);
            if (remaining > 0) rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);

        const timer = setTimeout(() => onDismiss(t.id), duration);
        return () => {
            clearTimeout(timer);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [t.id, duration, onDismiss]);

    return (
        <motion.div
            ref={ref}
            layout
            initial={{ opacity: 0, x: 24, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`group relative flex items-start gap-4 px-5 py-4 rounded-2xl border backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] min-w-[320px] max-w-[420px] overflow-hidden bg-[#0A0E1A]/80 ${cfg.border}`}
            style={{ fontFamily: 'Inter, sans-serif' }}
        >
            {/* Progress bar */}
            <div
                className="absolute bottom-0 left-0 h-[2px] transition-none opacity-60"
                style={{ width: `${progress}%`, backgroundColor: cfg.color }}
            />

            {/* Icon Column */}
            <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg shadow-black/20 ${cfg.bg}`}>
                {cfg.icon}
            </div>

            {/* Content Column */}
            <div className="flex-1 min-w-0 pt-0.5 pb-1">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] opacity-80" style={{ color: cfg.color }}>
                        {cfg.label}
                    </span>
                </div>
                <p className="text-[#F1F5F9] text-[13px] leading-relaxed font-medium">
                    {t.message}
                </p>
            </div>

            {/* Dismiss Button */}
            <button
                onClick={() => onDismiss(t.id)}
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-[#475569] hover:text-[#F1F5F9] hover:bg-white/5 transition-all mt-0.5"
            >
                <X size={14} strokeWidth={2.5} />
            </button>
        </motion.div>
    );
});

ToastItem.displayName = 'ToastItem';

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback((message: string | { title?: string; description?: string; msg?: string; status?: string; type?: string; message?: string }, type: ToastType = 'info', duration = 4000) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        
        let finalMessage = '';
        let finalType = type;

        if (typeof message === 'object' && message !== null) {
            // Handle old-style object: { title, description, status, msg }
            const obj = message as any;
            finalMessage = obj.description || obj.message || obj.msg || obj.title || 'Notification';
            finalType = (obj.status || obj.type || type) as ToastType;
        } else {
            finalMessage = message;
        }

        // Map 'success' | 'err' | 'warning' | 'info' correctly
        if (finalType === ('error' as any)) finalType = 'error';
        if (finalType === ('success' as any)) finalType = 'success';
        
        // Cap at 5 toasts to avoid overflow
        setToasts((prev) => [...prev.slice(-4), { id, message: finalMessage, type: finalType, duration }]);
    }, []);

    const ctx: ToastContextType = {
        toast: addToast as any,
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error'),
        warning: (msg) => addToast(msg, 'warning'),
        info: (msg) => addToast(msg, 'info'),
    };

    return (
        <ToastContext.Provider value={ctx}>
            {children}
            <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map((t) => (
                        <div key={t.id} className="pointer-events-auto">
                            <ToastItem toast={t} onDismiss={dismiss} />
                        </div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}
