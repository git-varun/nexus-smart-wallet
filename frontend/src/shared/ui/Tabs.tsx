import React from 'react';
import { cn } from '@/shared/lib/cn';

export interface TabItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
}

export interface TabsProps {
    tabs: TabItem[];
    activeTab: string;
    onChange: (tabId: string) => void;
    className?: string;
    contentClassName?: string;
    children?: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({
    tabs,
    activeTab,
    onChange,
    className,
    contentClassName,
    children
}) => {
    return (
        <div className={cn("space-y-4 w-full", className)}>
            <div className="flex border-b border-border overflow-x-auto scrollbar-none">
                <nav className="flex gap-6" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const isActive = tab.id === activeTab;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => onChange(tab.id)}
                                aria-selected={isActive}
                                role="tab"
                                className={cn(
                                    "flex items-center gap-2 border-b-2 border-transparent pb-3 px-1 text-sm font-medium text-muted-foreground transition-all hover:text-foreground focus:outline-none whitespace-nowrap",
                                    isActive && "border-primary text-foreground font-semibold"
                                )}
                            >
                                {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>
            {children && (
                <div className={cn("pt-2", contentClassName)}>
                    {children}
                </div>
            )}
        </div>
    );
};
