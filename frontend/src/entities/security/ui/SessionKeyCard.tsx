import React from 'react';
import { Card } from '@/app/layouts/Layout';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { cn } from '@/shared/lib/cn';
import { Key, Target, Clock, Trash2 } from 'lucide-react';

export interface SessionKeyCardProps {
    publicKey: string;
    spendingLimit: string;
    allowedTargets: string[];
    expiryTime: number;
    isActive: boolean;
    isRevoking?: boolean;
    className?: string;
    onRevoke?: () => void;
}

export const SessionKeyCard: React.FC<SessionKeyCardProps> = ({
    publicKey,
    spendingLimit,
    allowedTargets = [],
    expiryTime,
    isActive,
    isRevoking = false,
    className,
    onRevoke
}) => {
    const isExpired = expiryTime <= Math.floor(Date.now() / 1000);
    const formattedExpiry = new Date(expiryTime * 1000).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    const displayKey = `${publicKey.substring(0, 10)}...${publicKey.substring(publicKey.length - 8)}`;

    return (
        <Card className={cn("p-5 bg-card/60 backdrop-blur-sm border border-border/80 flex flex-col justify-between gap-5", className)}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",
                        isActive && !isExpired 
                            ? "bg-primary/10 border-primary/20 text-primary" 
                            : "bg-muted border-border text-muted-foreground"
                    )}>
                        <Key className="w-4.5 h-4.5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-foreground text-sm leading-snug">{displayKey}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground font-semibold">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground/80" />
                            <span>Expires {formattedExpiry}</span>
                        </div>
                    </div>
                </div>

                <Badge variant={isActive && !isExpired ? 'success' : 'warning'} className="uppercase text-[9px] font-extrabold tracking-wider">
                    {isActive && !isExpired ? 'Active' : isExpired ? 'Expired' : 'Revoked'}
                </Badge>
            </div>

            <div className="space-y-3.5 border-t border-border/60 pt-4 text-xs font-semibold">
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Spending Limit</span>
                    <span className="text-foreground font-mono font-bold">{spendingLimit} ETH</span>
                </div>
                
                <div className="space-y-1.5">
                    <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider block">Allowed Targets</span>
                    {allowedTargets.length === 0 ? (
                        <span className="text-muted-foreground">Any Target Address</span>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {allowedTargets.map(target => (
                                <div key={target} className="flex items-center gap-1.5 text-foreground font-mono text-[11px]">
                                    <Target className="w-3.5 h-3.5 text-primary shrink-0" />
                                    <span>{target.substring(0, 12)}...{target.substring(target.length - 8)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {onRevoke && isActive && !isExpired && (
                <div className="pt-2 border-t border-border/60">
                    <Button 
                        onClick={onRevoke} 
                        loading={isRevoking}
                        variant="danger" 
                        size="sm" 
                        className="w-full flex items-center justify-center gap-1.5 text-xs h-9 rounded-xl"
                    >
                        <Trash2 className="w-4 h-4" />
                        Revoke Permissions
                    </Button>
                </div>
            )}
        </Card>
    );
};
export default SessionKeyCard;
