import React, { useState } from 'react';
import { Send, Download, Copy, Check, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { useBackendSmartAccount } from '@/entities/wallet/hooks/useBackendSmartAccount';
import { usePortfolio } from '@/entities/portfolio/hooks/usePortfolio';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/Dialog';

export const QuickActions: React.FC = () => {
    const { smartAccountAddress, accountInfo, deploySmartAccount } = useBackendSmartAccount();
    const { refreshPortfolio, isRefreshing } = usePortfolio();
    const navigate = useNavigate();

    const [isCopied, setIsCopied] = useState(false);
    const [isReceiveOpen, setIsReceiveOpen] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const [deployError, setDeployError] = useState<string | null>(null);

    const handleCopy = async () => {
        if (!smartAccountAddress) return;
        try {
            await navigator.clipboard.writeText(smartAccountAddress);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy address:', err);
        }
    };

    const handleDeploy = async () => {
        setIsDeploying(true);
        setDeployError(null);
        try {
            await deploySmartAccount();
        } catch (err) {
            setDeployError(err instanceof Error ? err.message : 'Deployment failed');
        } finally {
            setIsDeploying(false);
        }
    };

    return (
        <>
            <Card variant="default" className="h-full">
                <CardHeader>
                    <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Button 
                            variant="primary" 
                            glow
                            onClick={() => navigate('/transfer')}
                            className="flex flex-col items-center gap-2 h-20 text-xs w-full"
                        >
                            <Send className="w-5 h-5 text-current" />
                            <span>Send Funds</span>
                        </Button>

                        <Button 
                            variant="secondary" 
                            onClick={() => setIsReceiveOpen(true)}
                            className="flex flex-col items-center gap-2 h-20 text-xs w-full"
                        >
                            <Download className="w-5 h-5 text-current" />
                            <span>Receive</span>
                        </Button>
                    </div>

                    <div className="space-y-3 pt-2">
                        {/* Deployment trigger */}
                        {accountInfo && !accountInfo.isDeployed && (
                            <Button 
                                variant="outline" 
                                loading={isDeploying} 
                                onClick={handleDeploy}
                                className="w-full text-xs border-yellow-500/40 text-yellow-500 hover:bg-yellow-500/10"
                            >
                                Deploy Account Contract
                            </Button>
                        )}
                        {deployError && (
                            <p className="text-[10px] text-red-500 text-center">{deployError}</p>
                        )}

                        {/* Portfolio manual refresh */}
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            loading={isRefreshing}
                            onClick={refreshPortfolio}
                            className="w-full text-xs text-muted-foreground flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Refresh Assets Cache</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Receive Funds Dialog */}
            <Dialog open={isReceiveOpen} onOpenChange={setIsReceiveOpen}>
                <DialogContent className="max-w-sm sm:max-w-md bg-card border-border">
                    <DialogHeader>
                        <DialogTitle>Receive Assets</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center p-6 space-y-6">
                        {/* CSS QR Code Placeholder representation */}
                        <div className="w-48 h-48 bg-white p-3 rounded-xl border border-border flex items-center justify-center relative">
                            {/* Decorative blocks inside to simulate qr code aesthetic */}
                            <div className="grid grid-cols-5 gap-1.5 w-full h-full opacity-90 p-1">
                                {[...Array(25)].map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`rounded-sm ${
                                            (i % 3 === 0 || i % 7 === 0 || i === 0 || i === 4 || i === 20 || i === 24)
                                                ? 'bg-slate-900' 
                                                : 'bg-transparent'
                                        }`}
                                    />
                                ))}
                            </div>
                            <span className="absolute text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded shadow-sm font-semibold">
                                SEPOLIA BASE
                            </span>
                        </div>

                        <div className="space-y-2 text-center w-full">
                            <p className="text-xs text-muted-foreground">
                                Only send Sepolia Testnet assets to this Smart Wallet Address.
                            </p>
                            {smartAccountAddress && (
                                <div className="p-3 bg-muted/20 border border-border/40 rounded-lg flex items-center justify-between gap-3">
                                    <span className="font-mono text-xs text-foreground select-all break-all text-left">
                                        {smartAccountAddress}
                                    </span>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={handleCopy}
                                        className="shrink-0 p-1.5"
                                        aria-label="Copy smart account address"
                                    >
                                        {isCopied ? (
                                            <Check className="w-4 h-4 text-emerald-500" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
