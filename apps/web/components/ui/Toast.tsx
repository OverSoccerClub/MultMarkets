'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    AlertCircle,
    Info,
    AlertTriangle,
    X
} from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
    description?: string;
}

interface ToastContextType {
    toast: (type: ToastType, message: string, description?: string) => void;
    success: (message: string, description?: string) => void;
    error: (message: string, description?: string) => void;
    info: (message: string, description?: string) => void;
    warning: (message: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toast = useCallback((type: ToastType, message: string, description?: string) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, type, message, description }]);
        setTimeout(() => removeToast(id), 5000);
    }, [removeToast]);

    const success = (msg: string, desc?: string) => toast('success', msg, desc);
    const error = (msg: string, desc?: string) => toast('error', msg, desc);
    const info = (msg: string, desc?: string) => toast('info', msg, desc);
    const warning = (msg: string, desc?: string) => toast('warning', msg, desc);

    return (
        <ToastContext.Provider value={{ toast, success, error, info, warning }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map((t) => (
                        <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

const ToastItem = React.forwardRef<HTMLDivElement, { toast: Toast; onRemove: () => void }>(({ toast, onRemove }, ref) => {
    const icons = {
        success: <CheckCircle2 className="text-yes-400" size={20} />,
        error: <AlertCircle className="text-no-400" size={20} />,
        info: <Info className="text-accent-400" size={20} />,
        warning: <AlertTriangle className="text-yellow-400" size={20} />,
    };

    const borders = {
        success: 'border-yes-500/20',
        error: 'border-no-500/20',
        info: 'border-accent-500/20',
        warning: 'border-yellow-500/20',
    };

    const glows = {
        success: 'shadow-[0_0_20px_-5px_rgba(34,197,94,0.3)]',
        error: 'shadow-[0_0_20px_-5px_rgba(239,68,68,0.3)]',
        info: 'shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]',
        warning: 'shadow-[0_0_20px_-5px_rgba(234,179,8,0.3)]',
    };

    return (
        <motion.div
            ref={ref}
            layout
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            className={`
        pointer-events-auto
        group relative flex min-w-[320px] items-start gap-3 rounded-2xl p-4
        bg-[#0a0f1d]/80 backdrop-blur-xl border ${borders[toast.type]}
        ${glows[toast.type]} transition-all duration-300 hover:scale-[1.02]
      `}
        >
            <div className="mt-0.5">{icons[toast.type]}</div>
            <div className="flex-1">
                <h4 className="text-sm font-bold text-white leading-tight">
                    {toast.message}
                </h4>
                {toast.description && (
                    <p className="mt-1 text-xs text-text-secondary leading-relaxed">
                        {toast.description}
                    </p>
                )}
            </div>
            <button
                onClick={onRemove}
                className="text-text-muted hover:text-white transition-colors"
            >
                <X size={16} />
            </button>

            {/* Progress Bar Animation */}
            <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5, ease: 'linear' }}
                className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r ${toast.type === 'success' ? 'from-yes-500/50' :
                    toast.type === 'error' ? 'from-no-500/50' :
                        toast.type === 'info' ? 'from-accent-500/50' :
                            'from-yellow-500/50'
                    } to-transparent rounded-full`}
            />
        </motion.div>
    );
});

ToastItem.displayName = 'ToastItem';
