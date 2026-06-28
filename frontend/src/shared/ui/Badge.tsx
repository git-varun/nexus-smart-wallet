import React from 'react';
import { cn } from '@/shared/lib/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
    variant = 'default',
    className,
    children,
    ...props
}) => {
    const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-all';

    const variants = {
        default: 'bg-muted/40 border-border text-foreground',
        primary: 'bg-primary/10 border-primary/20 text-primary-foreground', // wait, primary foreground in dark mode is white, let's keep text colors indigo
        success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
        warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
        danger: 'bg-red-500/10 border-red-500/20 text-red-500',
        secondary: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-500'
    };

    return (
        <span
            className={cn(baseClasses, variants[variant], className)}
            {...props}
        >
            {children}
        </span>
    );
};
