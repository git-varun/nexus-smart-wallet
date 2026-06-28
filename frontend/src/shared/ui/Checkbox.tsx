import React, { forwardRef } from 'react';
import { cn } from '@/shared/lib/cn';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
    label,
    className,
    disabled = false,
    ...props
}, ref) => {
    return (
        <label className={cn(
            "flex items-center gap-2 select-none",
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        )}>
            <input
                ref={ref}
                type="checkbox"
                disabled={disabled}
                className={cn(
                    "h-4 w-4 rounded border-border bg-background/30 text-primary transition-colors focus:ring-primary focus:ring-offset-0 focus:outline-none disabled:cursor-not-allowed",
                    className
                )}
                {...props}
            />
            {label && (
                <span className="text-sm font-medium text-foreground">
                    {label}
                </span>
            )}
        </label>
    );
});

Checkbox.displayName = 'Checkbox';
