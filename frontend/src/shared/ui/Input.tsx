import React, { forwardRef } from 'react';
import { cn } from '@/shared/lib/cn';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'error'> {
    error?: boolean | string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    label?: string;
    helperText?: string;
    variant?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
    error = false,
    leftIcon,
    rightIcon,
    label,
    helperText,
    variant,
    className,
    disabled = false,
    required,
    ...props
}, ref) => {
    const hasError = !!error;
    const errorMessage = typeof error === 'string' ? error : undefined;
    const generatedId = React.useId();
    const inputId = props.id || generatedId;

    const inputElement = (
        <div className="relative w-full">
            {leftIcon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0 pointer-events-none select-none">
                    {leftIcon}
                </div>
            )}
            <input
                id={inputId}
                ref={ref}
                disabled={disabled}
                required={required}
                aria-invalid={hasError ? 'true' : 'false'}
                className={cn(
                    "flex h-10 w-full rounded-lg border border-border bg-background/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50",
                    leftIcon && "pl-10",
                    rightIcon && "pr-10",
                    hasError && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20",
                    variant === 'cyber' && "border-primary/20 bg-primary/5 focus-visible:border-primary focus-visible:ring-primary/20",
                    className
                )}
                {...props}
            />
            {rightIcon && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0 pointer-events-none select-none">
                    {rightIcon}
                </div>
            )}
        </div>
    );

    if (label || errorMessage || helperText) {
        return (
            <div className="space-y-1.5 w-full">
                {label && (
                    <label htmlFor={inputId} className="block text-sm font-semibold text-foreground">
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                {inputElement}
                {errorMessage && (
                    <p className="text-red-500 text-xs mt-1 animate-slide-in flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errorMessage}
                    </p>
                )}
                {helperText && !errorMessage && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }

    return inputElement;
});

Input.displayName = 'Input';
