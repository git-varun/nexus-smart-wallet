import React from 'react';
import { Card } from '@/app/layouts/Layout';
import { cn } from '@/shared/lib/cn';
import { LucideIcon, ArrowRight } from 'lucide-react';

export interface QuickActionCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    onClick: () => void;
    color?: 'primary' | 'secondary' | 'emerald' | 'amber';
    className?: string;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
    title,
    description,
    icon: Icon,
    onClick,
    color = 'primary',
    className
}) => {
    const config = {
        primary: "bg-primary/10 border-primary/20 text-primary hover:border-primary/40 hover:shadow-neon",
        secondary: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:border-indigo-500/40 hover:shadow-neon",
        emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:border-emerald-500/40 hover:shadow-neon-cyan",
        amber: "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:border-amber-500/40 hover:shadow-neon-cyan"
    };

    return (
        <Card
            hoverable
            onClick={onClick}
            className={cn(
                "p-5 flex items-center justify-between gap-4 border transition-all duration-200",
                config[color] || config.primary,
                className
            )}
        >
            <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-current" />
                </div>
                
                <div className="min-w-0">
                    <h4 className="font-bold text-foreground text-sm leading-snug">{title}</h4>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-xs">{description}</p>
                </div>
            </div>

            <ArrowRight className="w-4 h-4 text-muted-foreground/60 shrink-0" />
        </Card>
    );
};
export default QuickActionCard;
