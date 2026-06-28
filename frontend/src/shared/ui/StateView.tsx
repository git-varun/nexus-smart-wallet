import React from 'react';
import { Button } from './Button';
import { cn } from '@/shared/lib/cn';

type StateType = 'loading' | 'empty' | 'success' | 'error' | 'offline' | 'unauthorized' | 'no-results' | 'forbidden';

export interface StateViewProps {
    type: StateType;
    title?: string;
    description?: string;
    actionText?: string;
    onAction?: () => void;
    className?: string;
}

export const StateView: React.FC<StateViewProps> = ({
    type,
    title,
    description,
    actionText,
    onAction,
    className
}) => {
    // Default metadata per status type
    const defaults: Record<StateType, { title: string; description: string; icon: React.ReactNode }> = {
        loading: {
            title: 'Loading Data...',
            description: 'Fetching information from the secure smart vault.',
            icon: (
                <svg className="w-10 h-10 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            )
        },
        empty: {
            title: 'No Data Available',
            description: 'There is nothing to display here yet.',
            icon: (
                <svg className="w-10 h-10 text-muted-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5M14 10h-4" />
                </svg>
            )
        },
        success: {
            title: 'Action Successful',
            description: 'The transaction has been successfully confirmed.',
            icon: (
                <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        error: {
            title: 'Something went wrong',
            description: 'An unexpected error occurred. Please try again.',
            icon: (
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
            )
        },
        offline: {
            title: 'Connection Lost',
            description: 'You are currently offline. Check your internet settings.',
            icon: (
                <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636a9 9 0 010 12.728m0-12.728l-1.414 1.414m1.414-1.414zM5.636 18.364a9 9 0 010-12.728m0 12.728l1.414-1.414m-1.414 1.414zM12 10a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
            )
        },
        unauthorized: {
            title: 'Access Denied',
            description: 'Your session has expired. Please sign in again.',
            icon: (
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            )
        },
        forbidden: {
            title: 'Access Forbidden',
            description: 'You do not have the required capability permissions to view this module.',
            icon: (
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            )
        },
        'no-results': {
            title: 'No Matches Found',
            description: 'Try adjusting your filters or search query.',
            icon: (
                <svg className="w-10 h-10 text-muted-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            )
        }
    };

    const activeTitle = title || defaults[type].title;
    const activeDescription = description || defaults[type].description;

    return (
        <div className={cn(
            "flex flex-col items-center justify-center text-center p-8 border border-border/40 rounded-xl bg-card/10 backdrop-blur-sm max-w-md mx-auto w-full",
            className
        )}>
            <div className="shrink-0 mb-4">{defaults[type].icon}</div>
            <h3 className="text-lg font-bold text-foreground tracking-tight mb-2">
                {activeTitle}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                {activeDescription}
            </p>
            {actionText && onAction && (
                <Button
                    variant={type === 'error' ? 'danger' : 'primary'}
                    onClick={onAction}
                    size="sm"
                >
                    {actionText}
                </Button>
            )}
        </div>
    );
};
