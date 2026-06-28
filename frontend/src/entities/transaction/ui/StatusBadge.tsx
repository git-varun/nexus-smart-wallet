import React from 'react';
import { cn } from '@/shared/lib/cn';

export interface StatusBadgeProps {
    status: 'pending' | 'success' | 'confirmed' | 'failed' | 'queued' | 'processing' | 'submitted' | 'retrying' | 'cancelled';
    className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
    const config = {
        success: { label: 'success', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
        confirmed: { label: 'confirmed', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
        failed: { label: 'failed', color: 'bg-red-500/10 text-red-400 border border-red-500/20' },
        pending: { label: 'pending', color: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 animate-pulse' },
        queued: { label: 'queued', color: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
        processing: { label: 'processing', color: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse' },
        submitted: { label: 'submitted', color: 'bg-teal-500/10 text-teal-400 border border-teal-500/20' },
        retrying: { label: 'retrying', color: 'bg-orange-500/10 text-orange-400 border border-orange-500/20 animate-pulse' },
        cancelled: { label: 'cancelled', color: 'bg-muted text-muted-foreground border border-border' }
    };

    const active = config[status] || { label: status, color: 'bg-muted text-muted-foreground border border-border' };

    return (
        <span className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
            active.color,
            className
        )}>
            {active.label}
        </span>
    );
};
export default StatusBadge;
