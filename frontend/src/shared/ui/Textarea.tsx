import React, { forwardRef } from 'react';
import { cn } from '@/shared/lib/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
    error = false,
    className,
    disabled = false,
    ...props
}, ref) => {
    return (
        <textarea
            ref={ref}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            className={cn(
                "flex min-h-[80px] w-full rounded-lg border border-border bg-background/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 resize-y",
                error && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20",
                className
            )}
            {...props}
        />
    );
});

Textarea.displayName = 'Textarea';
