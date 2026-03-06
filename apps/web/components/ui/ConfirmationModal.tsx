'use client';

import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'warning',
    isLoading = false,
}) => {
    const themes = {
        danger: {
            icon: <ShieldAlert className="text-no-500" size={32} />,
            button: 'bg-no-500 hover:bg-no-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]',
            border: 'border-no-500/20',
            bg: 'bg-no-500/5',
        },
        warning: {
            icon: <AlertTriangle className="text-yellow-500" size={32} />,
            button: 'bg-yellow-600 hover:bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]',
            border: 'border-yellow-500/20',
            bg: 'bg-yellow-500/5',
        },
        info: {
            icon: <AlertTriangle className="text-accent-500" size={32} />,
            button: 'bg-accent-500 hover:bg-accent-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
            border: 'border-accent-500/20',
            bg: 'bg-accent-500/5',
        },
    };

    const currentTheme = themes[variant];

    return (
        <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm" showCloseButton={false}>
            <div className="flex flex-col items-center text-center space-y-6 py-4">
                <div className={`p-4 rounded-[2rem] border ${currentTheme.border} ${currentTheme.bg}`}>
                    {currentTheme.icon}
                </div>

                <div className="space-y-2">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">{title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed px-4">
                        {message}
                    </p>
                </div>

                <div className="flex w-full gap-3 pt-4">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white hover:bg-white/5 transition-all"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`
              flex-1 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white
              transition-all duration-300 disabled:opacity-50
              ${currentTheme.button}
            `}
                    >
                        {isLoading ? 'Processando...' : confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
