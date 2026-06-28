import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/shared/lib/cn';

export interface SelectOption {
    value: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
}

export interface SelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    error?: boolean;
    className?: string;
}

export const Select: React.FC<SelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select an option',
    disabled = false,
    error = false,
    className
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;
        
        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                setIsOpen(!isOpen);
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                } else {
                    const currentIndex = options.findIndex(opt => opt.value === value);
                    const nextIndex = (currentIndex + 1) % options.length;
                    onChange(options[nextIndex].value);
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                } else {
                    const currentIndex = options.findIndex(opt => opt.value === value);
                    const prevIndex = (currentIndex - 1 + options.length) % options.length;
                    onChange(options[prevIndex].value);
                }
                break;
            default:
                break;
        }
    };

    return (
        <div ref={containerRef} className={cn("relative w-full", className)}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                className={cn(
                    "flex h-10 w-full items-center justify-between rounded-lg border border-border bg-background/30 px-3 py-2 text-sm text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-50",
                    error && "border-red-500 focus:ring-red-500/20",
                    isOpen && "ring-2 ring-primary border-primary"
                )}
            >
                <div className="flex items-center gap-2 truncate">
                    {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
                    <span className={cn("truncate", !selectedOption && "text-muted-foreground/50")}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <svg className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <ul
                    role="listbox"
                    aria-activedescendant={value}
                    className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-popover p-1 shadow-lg focus:outline-none animate-fade-in"
                >
                    {options.map((option) => {
                        const isSelected = option.value === value;
                        return (
                            <li
                                key={option.value}
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "flex flex-col gap-0.5 cursor-pointer select-none rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted/40",
                                    isSelected && "bg-primary text-primary-foreground hover:bg-primary/90"
                                )}
                            >
                                <div className="flex items-center gap-2 truncate font-semibold">
                                    {option.icon && <span className="shrink-0">{option.icon}</span>}
                                    <span className="truncate">{option.label}</span>
                                    {isSelected && (
                                        <svg className="ml-auto w-4 h-4 text-current shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                {option.description && (
                                    <p className={cn("text-xs text-muted-foreground truncate", isSelected && "text-primary-foreground/80")}>
                                        {option.description}
                                    </p>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};
