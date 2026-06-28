import React from 'react';
import { Card } from '@/app/layouts/Layout';
import { cn } from '@/shared/lib/cn';
import { Shield, ShieldCheck, CheckCircle } from 'lucide-react';

export interface SecurityCardProps {
    guardiansCount: number;
    threshold: number;
    recoveryStatus: 'active' | 'none' | 'pending';
    className?: string;
    onManageGuardians?: () => void;
}

export const SecurityCard: React.FC<SecurityCardProps> = ({
    guardiansCount,
    threshold,
    className,
    onManageGuardians
}) => {
    return (
        <Card className={cn("p-6 bg-card/60 backdrop-blur-sm border border-border/80 shadow-md relative overflow-hidden", className)}>
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">Multi-Sig Security</span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-extrabold text-foreground font-sans">
                            {guardiansCount > 0 ? `${threshold}/${guardiansCount}` : 'Standard'}
                        </span>
                        {guardiansCount > 0 && <span className="text-xs text-muted-foreground font-bold">Guardians</span>}
                    </div>
                </div>

                <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border",
                    guardiansCount > 0 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                        : "bg-primary/10 border-primary/20 text-primary"
                )}>
                    {guardiansCount > 0 ? <ShieldCheck className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                </div>
            </div>

            <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                {guardiansCount > 0 
                    ? `Requires execution signatures from at least ${threshold} authorized recovery guardians to execute key recovery procedures.`
                    : 'Configure social recovery guardians to ensure access can be recovered if you lose your primary keys.'}
            </p>

            <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Recovery Configured</span>
                </div>
                {onManageGuardians && (
                    <button 
                        onClick={onManageGuardians} 
                        className="text-primary hover:text-primary/80 font-bold transition-colors"
                    >
                        {guardiansCount > 0 ? 'Edit Guardians' : 'Set Up'}
                    </button>
                )}
            </div>
        </Card>
    );
};
export default SecurityCard;
