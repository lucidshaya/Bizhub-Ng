import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
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

const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 size={18} />,
    error: <XCircle size={18} />,
    warning: <AlertTriangle size={18} />,
    info: <Info size={18} />,
};

const styles: Record<ToastType, string> = {
    success: 'bg-[#00D084]/15 border-[#00D084]/30 text-[#00D084]',
    error: 'bg-[#EF4444]/15 border-[#EF4444]/30 text-[#EF4444]',
    warning: 'bg-[#F59E0B]/15 border-[#F59E0B]/30 text-[#F59E0B]',
    info: 'bg-[#3B82F6]/15 border-[#3B82F6]/30 text-[#3B82F6]',
};

function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(t.id), t.duration || 4000);
        return () => clearTimeout(timer);
    }, [t.id, t.duration, onDismiss]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-lg shadow-2xl min-w-[320px] max-w-[420px] ${styles[t.type]}`}
        >
            <span className="mt-0.5 flex-shrink-0">{icons[t.type]}</span>
            <p className="text-[#F1F5F9] text-sm flex-1 leading-snug">{t.message}</p>
            <button onClick={() => onDismiss(t.id)} className="flex-shrink-0 mt-0.5 opacity-50 hover:opacity-100 transition-opacity">
                <X size={14} />
            </button>
        </motion.div>
    );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        setToasts((prev) => [...prev, { id, message, type, duration }]);
    }, []);

    const ctx: ToastContextType = {
        toast: addToast,
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error'),
        warning: (msg) => addToast(msg, 'warning'),
        info: (msg) => addToast(msg, 'info'),
    };

    return (
        <ToastContext.Provider value={ctx}>
            {children}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
                <AnimatePresence mode="popLayout">
                    {toasts.map((t) => (
                        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}
