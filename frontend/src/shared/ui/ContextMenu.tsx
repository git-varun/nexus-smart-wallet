/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect, forwardRef } from 'react';
import { cn } from '@/shared/lib/cn';

interface ContextMenuTriggerProps {
    children: React.ReactNode;
    onContextMenu: (e: React.MouseEvent) => void;
    className?: string;
}

export const ContextMenuTrigger: React.FC<ContextMenuTriggerProps> = ({ 
    children, 
    onContextMenu,
    className 
}) => {
    return (
        <div onContextMenu={onContextMenu} className={cn("w-full", className)}>
            {children}
        </div>
    );
};

interface ContextMenuContentProps {
    x: number;
    y: number;
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

export const ContextMenuContent = forwardRef<HTMLDivElement, ContextMenuContentProps>(({
    x,
    y,
    isOpen,
    onClose,
    children
}, ref) => {
    useEffect(() => {
        const handleOutsideClick = () => {
            if (isOpen) onClose();
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('click', handleOutsideClick);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('click', handleOutsideClick);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={ref}
            style={{ top: y, left: x }}
            className="fixed z-50 min-w-[8rem] overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-md animate-slide-in"
        >
            {children}
        </div>
    );
});
ContextMenuContent.displayName = 'ContextMenuContent';

interface ContextMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    inset?: boolean;
}

export const ContextMenuItem = React.forwardRef<HTMLButtonElement, ContextMenuItemProps>(({ 
    className, 
    inset, 
    onClick,
    ...props 
}, ref) => {
    return (
        <button
            ref={ref}
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                if (onClick) onClick(e);
            }}
            className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-lg px-2.5 py-2 text-sm outline-none transition-colors hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary disabled:pointer-events-none disabled:opacity-50 text-left",
                inset && "pl-8",
                className
            )}
            {...props}
        />
    );
});
ContextMenuItem.displayName = 'ContextMenuItem';

export const ContextMenuSeparator: React.FC = () => {
    return <div className="-mx-1 my-1 h-px bg-border" />;
};

export const ContextMenuLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <div className="px-2.5 py-1.5 text-xs font-semibold text-muted-foreground">{children}</div>;
};

export const useContextMenu = () => {
    const [x, setX] = useState(0);
    const [y, setY] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setX(e.clientX);
        setY(e.clientY);
        setIsOpen(true);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    return {
        x,
        y,
        isOpen,
        handleContextMenu,
        handleClose
    };
};
export default useContextMenu;
