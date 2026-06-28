import React from 'react';
import { Card } from '@/app/layouts/Layout';
import { cn } from '@/shared/lib/cn';
import { Bell, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export interface NotificationCardProps {
    title: string;
    description: string;
    variant: 'default' | 'success' | 'warning' | 'error';
    timestamp: string;
    read: boolean;
    className?: string;
    onReadClick?: () => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
    title,
    description,
    variant,
    timestamp,
    read,
    className,
    onReadClick
}) => {
    const formattedTime = new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    const icons = {
        default: <Info className="w-4.5 h-4.5 text-primary" />,
        success: <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />,
        warning: <AlertTriangle className="w-4.5 h-4.5 text-yellow-400 animate-bounce" />,
        error: <AlertCircle className="w-4.5 h-4.5 text-red-400 animate-pulse" />
    };

    const borders = {
        default: 'border-border/80',
        success: 'border-emerald-500/20 bg-emerald-500/5',
        warning: 'border-yellow-500/20 bg-yellow-500/5',
        error: 'border-red-500/20 bg-red-500/5'
    };

    return (
        <Card className={cn(
            "p-4 border transition-all duration-200 flex items-start gap-3.5 relative overflow-hidden",
            borders[variant] || 'border-border/80',
            !read && "ring-1 ring-primary/25 shadow-sm bg-primary/5 border-primary/20",
            className
        )}>
            <div className="shrink-0 mt-0.5">{icons[variant] || <Bell className="w-4.5 h-4.5" />}</div>
            
            <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                    <span className={cn(
                        "font-bold text-foreground text-sm leading-tight truncate",
                        !read && "text-primary-foreground font-extrabold"
                    )}>
                        {title}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono font-medium shrink-0">{formattedTime}</span>
                </div>
                
                <p className="text-xs text-muted-foreground leading-relaxed leading-normal">{description}</p>
            </div>

            {!read && onReadClick && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onReadClick();
                    }}
                    className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"
                    title="Mark as read"
                />
            )}
        </Card>
    );
};
export default NotificationCard;
