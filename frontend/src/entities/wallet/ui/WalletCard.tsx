import React from 'react';
import { Card } from '@/app/layouts/Layout';
import { Badge } from '@/shared/ui/Badge';
import { cn } from '@/shared/lib/cn';
import { Shield, Copy, Check, Mail, HardDrive } from 'lucide-react';
import { useState } from 'react';

export interface WalletCardProps {
    address: string;
    accountType: string;
    isDeployed: boolean;
    connectionType: 'email' | 'metamask' | 'hardware' | 'other';
    email?: string;
    chainName?: string;
    className?: string;
}

export const WalletCard: React.FC<WalletCardProps> = ({
    address,
    accountType,
    isDeployed,
    connectionType,
    email,
    chainName,
    className
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const displayAddress = `${address.substring(0, 10)}...${address.substring(address.length - 8)}`;

    return (
        <Card className={cn("p-6 bg-card/60 backdrop-blur-sm border border-border/80 relative overflow-hidden", className)}>
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">Smart Vault Address</span>
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-foreground font-mono">{displayAddress}</span>
                        <button
                            onClick={handleCopy}
                            className="p-1 rounded bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                </div>

                <Badge variant={isDeployed ? 'success' : 'warning'} className="uppercase text-[9px] font-extrabold tracking-wider">
                    {isDeployed ? 'Deployed' : 'Pending Deployment'}
                </Badge>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 text-xs font-semibold border-t border-border/60 pt-5">
                <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider mb-0.5">Account Model</span>
                    <span className="text-foreground capitalize">{accountType}</span>
                </div>
                <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider mb-0.5">Active Network</span>
                    <span className="text-foreground">{chainName || 'Ethereum'}</span>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs font-semibold bg-muted/20 border border-border/60 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                    {connectionType === 'email' ? (
                        <Mail className="w-4 h-4 text-primary" />
                    ) : (
                        <HardDrive className="w-4 h-4 text-primary" />
                    )}
                    <div>
                        <span className="text-muted-foreground text-[10px] block font-bold leading-tight">Key Provider</span>
                        <span className="text-foreground leading-normal">{connectionType === 'email' ? email || 'Email Guardian' : 'Web3 Wallet'}</span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400">
                    <Shield className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Secured</span>
                </div>
            </div>
        </Card>
    );
};
export default WalletCard;
