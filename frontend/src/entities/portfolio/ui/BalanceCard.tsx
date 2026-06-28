import React from 'react';
import { Card } from '@/app/layouts/Layout';
import { cn } from '@/shared/lib/cn';
import { RefreshCw, TrendingUp } from 'lucide-react';

export interface ChainDistribution {
    chainId: number;
    chainName: string;
    balance: string;
    valueUsd: number;
}

export interface BalanceCardProps {
    totalValueUsd: number;
    distribution: ChainDistribution[];
    isLoading?: boolean;
    onRefresh?: () => void;
    className?: string;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
    totalValueUsd,
    distribution = [],
    isLoading = false,
    onRefresh,
    className
}) => {
    return (
        <Card className={cn("p-6 bg-card/60 backdrop-blur-sm border border-border/80 shadow-md relative overflow-hidden", className)}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    Total Net Worth
                </span>
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        disabled={isLoading}
                        className={cn(
                            "p-1.5 rounded-lg border border-border bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200",
                            isLoading && "animate-spin"
                        )}
                        title="Sync balances"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            <div className="mt-4 space-y-1">
                <span className="text-4xl font-extrabold text-foreground tracking-tight block font-sans">
                    ${totalValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-muted-foreground font-semibold">
                    Real-time consolidated multichain sync
                </span>
            </div>

            {distribution.length > 0 && (
                <div className="mt-6 pt-5 border-t border-border/60 space-y-3.5">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Chain Distribution</h5>
                    <div className="space-y-2.5">
                        {distribution.map(dist => (
                            <div key={dist.chainId} className="flex items-center justify-between text-xs font-semibold">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    {dist.chainName}
                                </span>
                                <span className="font-mono text-foreground">
                                    ${dist.valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
};
export default BalanceCard;
