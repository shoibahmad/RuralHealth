
import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.9 }}
                            layout
                            className={`pointer-events-auto min-w-[300px] max-w-md p-4 rounded-xl shadow-lg border backdrop-blur-md flex items-start gap-3 ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-100' :
                                    toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-100' :
                                        toast.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-100' :
                                            'bg-slate-800/90 border-slate-700 text-slate-100'
                                }`}
                        >
                            <div className={`mt-0.5 ${toast.type === 'success' ? 'text-emerald-400' :
                                    toast.type === 'error' ? 'text-red-400' :
                                        toast.type === 'warning' ? 'text-amber-400' :
                                            'text-blue-400'
                                }`}>
                                {toast.type === 'success' && <CheckCircle size={18} />}
                                {toast.type === 'error' && <AlertCircle size={18} />}
                                {toast.type === 'warning' && <AlertCircle size={18} />}
                                {toast.type === 'info' && <Info size={18} />}
                            </div>
                            <div className="flex-1 text-sm font-medium">{toast.message}</div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="text-white/40 hover:text-white transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};
