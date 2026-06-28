import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/cn';

export interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    disabled?: boolean;
    className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
    checked,
    onChange,
    label,
    disabled = false,
    className
}) => {
    return (
        <label className={cn(
            "flex items-center gap-2 select-none",
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
            className
        )}>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => !disabled && onChange(!checked)}
                className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed",
                    checked && "bg-primary"
                )}
            >
                <motion.span
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200",
                        checked ? "translate-x-5" : "translate-x-0"
                    )}
                />
            </button>
            {label && (
                <span className="text-sm font-medium text-foreground">
                    {label}
                </span>
            )}
        </label>
    );
};
