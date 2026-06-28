import React from 'react';
import { Card } from '@/app/layouts/Layout';
import { Button } from '@/shared/ui/Button';
import { cn } from '@/shared/lib/cn';
import { ArrowUpRight } from 'lucide-react';

export interface AssetCardProps {
    symbol: string;
    name: string;
    balance: string;
    valueUsd?: number;
    priceUsd?: number;
    className?: string;
    onSendClick?: () => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({
    symbol,
    name,
    balance,
    valueUsd,
    priceUsd,
    className,
    onSendClick
}) => {
    return (
        <Card hoverable className={cn("p-5 flex flex-col justify-between h-full bg-card/60 backdrop-blur-sm border border-border/80", className)}>
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-sm text-primary shrink-0">
                        {symbol.slice(0, 2)}
                    </div>
                    <div>
                        <h4 className="font-bold text-foreground text-sm leading-snug">{name}</h4>
                        <span className="text-xs text-muted-foreground font-semibold">{symbol}</span>
                    </div>
                </div>
                {priceUsd && (
                    <span className="text-xs font-mono text-muted-foreground font-semibold">
                        ${priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                )}
            </div>

            <div className="mt-6 flex items-end justify-between">
                <div className="space-y-1">
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">Balance</span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-extrabold text-foreground font-mono leading-none">{balance}</span>
                        <span className="text-xs text-muted-foreground font-bold">{symbol}</span>
                    </div>
                    {valueUsd !== undefined && (
                        <p className="text-xs text-muted-foreground font-mono font-medium">
                            ~${valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    )}
                </div>

                {onSendClick && (
                    <Button onClick={onSendClick} size="sm" variant="outline" className="h-8 py-0.5 px-2.5 rounded-lg text-xs font-bold gap-1">
                        Send <ArrowUpRight className="w-3.5 h-3.5" />
                    </Button>
                )}
            </div>
        </Card>
    );
};
export default AssetCard;
