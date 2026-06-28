import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/lib/cn';

export interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
    isOpen,
    onClose,
    title,
    children,
    className
}) => {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            // Lock background scroll
            document.body.style.overflow = 'hidden';
            
            // Focus overlay for accessibility esc listener
            overlayRef.current?.focus();
        } else {
            document.body.style.overflow = '';
        }
        
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-black backdrop-blur-sm"
                    />

                    {/* Drawer Pane */}
                    <motion.div
                        ref={overlayRef}
                        tabIndex={-1}
                        onKeyDown={handleKeyDown}
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        className={cn(
                            "fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-popover border-l border-border/80 shadow-2xl flex flex-col focus:outline-none",
                            className
                        )}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
                            <h3 className="text-lg font-semibold text-foreground tracking-tight">
                                {title}
                            </h3>
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted/30"
                                aria-label="Close Drawer"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-none">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
