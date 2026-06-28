import React from 'react';
import { cn } from '@/shared/lib/cn';

import { StateView } from '@/shared/ui/StateView';
import { ChevronRight } from 'lucide-react';

// Page Primitive
export interface PageProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    subtitle?: string;
    description?: string;
    primaryAction?: React.ReactNode;
    actions?: React.ReactNode;
    breadcrumbs?: string[];
    sidebarActions?: React.ReactNode;
    loading?: boolean;
    error?: string | Error | null;
    empty?: boolean;
    emptyTitle?: string;
    emptyDescription?: string;
    onRetry?: () => void;
    children: React.ReactNode;
}

export const Page: React.FC<PageProps> = ({
    title,
    subtitle,
    description,
    primaryAction,
    actions,
    breadcrumbs,
    sidebarActions,
    loading = false,
    error = null,
    empty = false,
    emptyTitle,
    emptyDescription,
    onRetry,
    className,
    children,
    ...props
}) => {
    const activeSubtitle = subtitle || description;
    const activeActions = actions || primaryAction;
    const hasError = !!error;
    const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : 'An error occurred';

    const renderContent = () => {
        if (loading) {
            return <StateView type="loading" className="my-12" />;
        }
        if (hasError) {
            return (
                <StateView
                    type="error"
                    title="Unexpected Error"
                    description={errorMessage}
                    actionText={onRetry ? "Try Again" : undefined}
                    onAction={onRetry}
                    className="my-12"
                />
            );
        }
        if (empty) {
            return (
                <StateView
                    type="empty"
                    title={emptyTitle || "No Data Available"}
                    description={emptyDescription || "There is nothing to display here yet."}
                    className="my-12"
                />
            );
        }

        // Return side layout if sidebar actions are provided
        if (sidebarActions) {
            return (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                    <div className="lg:col-span-3 space-y-6 md:space-y-8">
                        {children}
                    </div>
                    <aside className="lg:col-span-1 space-y-6 bg-card/40 border border-border/80 rounded-xl p-4 md:p-5 sticky top-20">
                        <h3 className="text-sm font-bold text-foreground tracking-tight uppercase border-b border-border/60 pb-3">
                            Page Tools
                        </h3>
                        <div className="space-y-4">
                            {sidebarActions}
                        </div>
                    </aside>
                </div>
            );
        }

        return <div className="space-y-6 md:space-y-8">{children}</div>;
    };

    return (
        <div className={cn("max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8 animate-fade-in", className)} {...props}>
            {/* Page Header (Breadcrumbs + Title Block) */}
            {(title || activeSubtitle || activeActions || breadcrumbs) && (
                <div className="space-y-3 border-b border-border/60 pb-6">
                    {breadcrumbs && breadcrumbs.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold tracking-wide">
                            {breadcrumbs.map((crumb, idx) => (
                                <React.Fragment key={idx}>
                                    <span>{crumb}</span>
                                    {idx < breadcrumbs.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/45" />}
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="space-y-1">
                            {title && <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{title}</h1>}
                            {activeSubtitle && <p className="text-sm text-muted-foreground">{activeSubtitle}</p>}
                        </div>
                        {activeActions && <div className="flex items-center gap-3 shrink-0">{activeActions}</div>}
                    </div>
                </div>
            )}

            {/* Render page content with layout state boundaries */}
            {renderContent()}
        </div>
    );
};

// Section Primitive
export interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({
    title,
    className,
    children,
    ...props
}) => {
    return (
        <section className={cn("space-y-4", className)} {...props}>
            {title && <h2 className="text-lg font-semibold text-foreground tracking-tight">{title}</h2>}
            <div className="space-y-4">
                {children}
            </div>
        </section>
    );
};

// Card Primitive
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    hoverable?: boolean;
    children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
    hoverable = false,
    className,
    children,
    ...props
}) => {
    return (
        <div
            className={cn(
                "bg-card border border-border rounded-xl p-5 md:p-6 transition-all duration-200 shadow-sm relative overflow-hidden",
                hoverable && "hover:border-primary/40 hover:shadow-md cursor-pointer",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

// Widget Primitive (Data/Metric display block)
export interface WidgetProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    value: React.ReactNode;
    secondaryText?: string;
    icon?: React.ReactNode;
    trend?: {
        value: string;
        direction: 'up' | 'down' | 'neutral';
    };
}

export const Widget: React.FC<WidgetProps> = ({
    title,
    value,
    secondaryText,
    icon,
    trend,
    className,
    ...props
}) => {
    return (
        <Card className={cn("flex flex-col justify-between", className)} {...props}>
            <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-semibold text-muted-foreground">{title}</span>
                {icon && <div className="text-muted-foreground shrink-0">{icon}</div>}
            </div>
            <div className="mt-4 space-y-1">
                <span className="text-3xl font-extrabold text-foreground tracking-tight block">
                    {value}
                </span>
                {(secondaryText || trend) && (
                    <div className="flex items-center gap-2 text-xs">
                        {trend && (
                            <span className={cn(
                                "font-medium",
                                trend.direction === 'up' && "text-emerald-500",
                                trend.direction === 'down' && "text-red-500",
                                trend.direction === 'neutral' && "text-muted-foreground"
                            )}>
                                {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : ''} {trend.value}
                            </span>
                        )}
                        {secondaryText && <span className="text-muted-foreground">{secondaryText}</span>}
                    </div>
                )}
            </div>
        </Card>
    );
};

// Control Primitive (Interactive form wrapper)
export interface ControlProps extends React.HTMLAttributes<HTMLDivElement> {
    label?: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
}

export const Control: React.FC<ControlProps> = ({
    label,
    required = false,
    error,
    className,
    children,
    ...props
}) => {
    return (
        <div className={cn("space-y-1.5 w-full", className)} {...props}>
            {label && (
                <label className="block text-sm font-semibold text-foreground">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative w-full">
                {children}
            </div>
            {error && (
                <p className="text-red-500 text-xs mt-1 animate-slide-in flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );
};

export { Shell } from '@/app/layouts/Shell';
