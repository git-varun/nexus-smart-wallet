import React from 'react';
import { cn } from '@/shared/lib/cn';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'info' | 'success' | 'warning' | 'danger';
    title?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
    variant = 'info',
    title,
    action,
    className,
    children,
    ...props
}) => {
    const borders = {
        info: 'border-blue-500/20 bg-blue-500/5 text-blue-400',
        success: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
        warning: 'border-yellow-500/20 bg-yellow-500/5 text-yellow-400',
        danger: 'border-red-500/20 bg-red-500/5 text-red-400'
    };

    const icons = {
        info: (
            <svg className="w-5 h-5 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        success: (
            <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        warning: (
            <svg className="w-5 h-5 text-yellow-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
        ),
        danger: (
            <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
        )
    };

    return (
        <div
            role="alert"
            className={cn(
                "flex items-start gap-3 rounded-lg border p-4 text-sm relative overflow-hidden",
                borders[variant],
                className
            )}
            {...props}
        >
            <div className="shrink-0 mt-0.5">{icons[variant]}</div>
            <div className="flex-1 space-y-1">
                {title && <h5 className="font-semibold text-foreground tracking-tight leading-none mb-1">{title}</h5>}
                <div className="text-muted-foreground text-xs leading-relaxed">{children}</div>
            </div>
            {action && <div className="shrink-0 ml-4">{action}</div>}
        </div>
    );
};
