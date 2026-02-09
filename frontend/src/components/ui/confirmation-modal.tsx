
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './button'; // Adjust path if needed (it's in . currently)
import { AlertTriangle, X } from 'lucide-react';

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
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    isLoading = false
}) => {
    if (!isOpen) return null;

    const colors = {
        danger: {
            icon: 'text-red-400',
            bg: 'bg-red-500/10',
            border: 'border-red-500/20',
            button: 'bg-red-500 hover:bg-red-600 text-white'
        },
        warning: {
            icon: 'text-amber-400',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            button: 'bg-amber-500 hover:bg-amber-600 text-white'
        },
        info: {
            icon: 'text-blue-400',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            button: 'bg-blue-500 hover:bg-blue-600 text-white'
        }
    };

    const theme = colors[variant];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative bg-slate-900 border border-white/10 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                >
                    <div className="p-6">
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-full ${theme.bg} ${theme.border} border`}>
                                <AlertTriangle className={`h-6 w-6 ${theme.icon}`} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{message}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-950/50 p-4 flex items-center justify-end gap-3 border-t border-white/5">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="text-slate-400 hover:text-white"
                            disabled={isLoading}
                        >
                            {cancelText}
                        </Button>
                        <Button
                            onClick={onConfirm}
                            className={theme.button}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Processing...' : confirmText}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
