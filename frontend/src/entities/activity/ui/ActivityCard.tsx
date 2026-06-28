import React from 'react';
import { Card } from '@/app/layouts/Layout';
import { StatusBadge } from '@/entities/transaction/ui/StatusBadge';
import { cn } from '@/shared/lib/cn';
import { ArrowUpRight, ArrowDownLeft, Terminal, Calendar } from 'lucide-react';

export interface ActivityCardProps {
    to: string;
    value: string;
    status: 'pending' | 'success' | 'confirmed' | 'failed' | 'queued' | 'processing' | 'submitted' | 'retrying' | 'cancelled';
    timestamp: number;
    symbol?: string;
    hash?: string;
    failureReason?: string;
    className?: string;
    onDetailClick?: () => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
    to,
    value,
    status,
    timestamp,
    symbol = 'ETH',
    hash,
    className,
    onDetailClick
}) => {
    const isSend = parseFloat(value) > 0;
    const formattedDate = new Date(timestamp).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const displayHash = hash ? `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}` : 'In Queue';

    return (
        <Card hoverable className={cn("p-4 bg-card/60 backdrop-blur-sm border border-border/80 flex items-center justify-between gap-4", className)} onClick={onDetailClick}>
            <div className="flex items-center gap-3.5 min-w-0">
                <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",
                    status === 'failed' 
                        ? "bg-red-500/10 border-red-500/20 text-red-400" 
                        : isSend 
                            ? "bg-primary/10 border-primary/20 text-primary" 
                            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                )}>
                    {status === 'failed' ? (
                        <Terminal className="w-4 h-4" />
                    ) : isSend ? (
                        <ArrowUpRight className="w-4 h-4" />
                    ) : (
                        <ArrowDownLeft className="w-4 h-4" />
                    )}
                </div>

                <div className="min-w-0">
                    <div className="font-semibold text-sm text-foreground truncate">
                        {isSend ? `Send to ${to.substring(0, 8)}...` : `Receive from ${to.substring(0, 8)}...`}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formattedDate}</span>
                        {hash && (
                            <>
                                <span className="text-muted-foreground/45">•</span>
                                <span className="font-mono">{displayHash}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0 text-right">
                <div className="font-mono font-bold text-sm text-foreground">
                    {isSend ? '-' : '+'}{value} {symbol}
                </div>
                <StatusBadge status={status} />
            </div>
        </Card>
    );
};
export default ActivityCard;
