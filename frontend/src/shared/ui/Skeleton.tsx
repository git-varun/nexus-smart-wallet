import React from 'react';
import { cn } from '@/shared/lib/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'text' | 'title' | 'circle' | 'rect';
}

export const Skeleton: React.FC<SkeletonProps> = ({
    variant = 'rect',
    className,
    ...props
}) => {
    return (
        <div
            className={cn(
                "bg-elevated animate-pulse",
                variant === 'text' && "h-4 w-full rounded-md",
                variant === 'title' && "h-6 w-1/3 rounded-md",
                variant === 'circle' && "h-10 w-10 rounded-full",
                variant === 'rect' && "h-20 w-full rounded-xl",
                className
            )}
            {...props}
        />
    );
};
