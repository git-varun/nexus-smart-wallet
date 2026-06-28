import React from 'react';
import { Shield, Key, CheckCircle, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { useSessionKeys } from '@/entities/sessionKey/hooks/useSessionKeys';
import { useNavigate } from 'react-router-dom';

export const SecurityOverview: React.FC = () => {
    const { sessionKeys, activeSessionKeys, expiredSessionKeys, isLoading } = useSessionKeys();
    const navigate = useNavigate();

    return (
        <Card variant="default" className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-web3-primary" />
                    <CardTitle className="text-lg font-bold">Security Overview</CardTitle>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate('/security')}
                    aria-label="Manage session keys"
                >
                    Manage Keys
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    <div className="space-y-3 animate-pulse">
                        <div className="h-8 bg-muted/40 rounded"></div>
                        <div className="h-16 bg-muted/40 rounded"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-muted/20 rounded-lg border border-border/40 flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 rounded-md">
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{activeSessionKeys.length}</p>
                                <p className="text-xs text-muted-foreground">Active Keys</p>
                            </div>
                        </div>

                        <div className="p-3 bg-muted/20 rounded-lg border border-border/40 flex items-center gap-3">
                            <div className="p-2 bg-yellow-500/10 rounded-md">
                                <Clock className="w-4 h-4 text-yellow-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{expiredSessionKeys.length}</p>
                                <p className="text-xs text-muted-foreground">Expired Keys</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-3 pt-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Active Ephemeral Sessions
                    </div>
                    {sessionKeys.length === 0 ? (
                        <div className="text-center py-4 bg-muted/10 rounded-lg border border-dashed border-border/40">
                            <Key className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">No active session keys found</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                            {activeSessionKeys.slice(0, 3).map((session) => (
                                <div 
                                    key={session.key} 
                                    className="p-2 bg-card/40 rounded border border-border/30 flex items-center justify-between text-xs"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="font-mono text-muted-foreground">
                                            {session.key.substring(0, 10)}...{session.key.substring(session.key.length - 4)}
                                        </span>
                                    </div>
                                    <span className="text-muted-foreground">
                                        Limit: {session.spendingLimit} ETH
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
