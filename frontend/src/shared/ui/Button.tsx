import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    success?: boolean;
    error?: boolean;
    glow?: boolean;
    children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
    variant = 'primary',
    size = 'md',
    loading = false,
    success = false,
    error = false,
    glow = false,
    disabled = false,
    className,
    children,
    ...props
}, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100';

    const variants = {
        primary: 'bg-primary text-primary-foreground hover:bg-opacity-90 focus-visible:ring-primary',
        secondary: 'bg-card border border-border text-foreground hover:bg-muted/50 focus-visible:ring-border',
        outline: 'bg-transparent border border-border text-foreground hover:bg-muted/30 focus-visible:ring-border',
        ghost: 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30 focus-visible:ring-border',
        danger: 'bg-red-500/10 border border-red-500 text-red-500 hover:bg-red-500/20 focus-visible:ring-red-500'
    };

    const sizes = {
        sm: 'h-8 px-3 text-xs gap-1.5',
        md: 'h-10 px-4 text-sm gap-2',
        lg: 'h-12 px-6 text-base gap-2.5'
    };

    // Accessibility state helper
    const ariaState = {
        'aria-busy': loading ? true : undefined,
        'aria-disabled': disabled || loading ? true : undefined
    };

    return (
        <button
            ref={ref}
            className={cn(
                baseClasses,
                variants[variant],
                sizes[size],
                success && 'border-emerald-500 text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/10',
                error && 'border-red-500 text-red-500 bg-red-500/10 hover:bg-red-500/10',
                glow && 'shadow-neon hover:shadow-neon/60 border-primary/20',
                className
            )}
            disabled={disabled || loading}
            {...ariaState}
            {...props}
        >
            {loading && (
                <motion.svg
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 text-current shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </motion.svg>
            )}
            {!loading && success && (
                <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            )}
            {!loading && error && (
                <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
            )}
            <span className="truncate">{children}</span>
        </button>
    );
});

Button.displayName = 'Button';
