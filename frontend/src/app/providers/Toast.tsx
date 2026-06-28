/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export interface ToastOptions {
    title: string;
    description?: string;
    variant?: 'default' | 'success' | 'error' | 'warning';
    duration?: number;
}

export interface ToastState extends ToastOptions {
    id: string;
}

interface ToastContextType {
    toasts: ToastState[];
    toast: (options: ToastOptions) => string;
    dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastState[]>([]);

    const toast = useCallback((options: ToastOptions) => {
        const id = Math.random().toString(36).substring(2, 9);
        const duration = options.duration || 5000;

        setToasts((prev) => [...prev, { ...options, id }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);

        return id;
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, toast, dismissToast }}>
            {children}
            <ToastViewport toasts={toasts} dismissToast={dismissToast} />
        </ToastContext.Provider>
    );
};

export const useGlobalToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useGlobalToast must be used within a ToastProvider');
    }
    return context;
};

interface ToastViewportProps {
    toasts: ToastState[];
    dismissToast: (id: string) => void;
}

const ToastViewport: React.FC<ToastViewportProps> = ({ toasts, dismissToast }) => {
    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
            <AnimatePresence>
                {toasts.map((t) => {
                    const icons = {
                        default: Info,
                        success: CheckCircle,
                        error: AlertCircle,
                        warning: AlertTriangle,
                    };
                    const IconComponent = icons[t.variant || 'default'];

                    const variantClasses = {
                        default: 'border-border bg-card text-foreground',
                        success: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400',
                        error: 'border-red-500/30 bg-red-950/20 text-red-400',
                        warning: 'border-yellow-500/30 bg-yellow-950/20 text-yellow-400',
                    };

                    return (
                        <motion.div
                            key={t.id}
                            layout
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md pointer-events-auto overflow-hidden ${
                                variantClasses[t.variant || 'default']
                            }`}
                        >
                            <IconComponent className="w-5 h-5 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold truncate">{t.title}</h4>
                                {t.description && (
                                    <p className="text-xs opacity-90 mt-1 leading-normal break-words">
                                        {t.description}
                                    </p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => dismissToast(t.id)}
                                className="text-muted-foreground hover:text-foreground shrink-0 rounded p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};
export default ToastProvider;
