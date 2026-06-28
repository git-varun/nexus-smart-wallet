import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/ui/Dialog';
import { useBackendSmartAccount } from '@/entities/wallet/hooks/useBackendSmartAccount';
import { useTransactionHistoryBackend, TransactionHistoryItem } from '@/entities/transaction/hooks/useTransactionHistoryBackend';
import { useCapabilities } from '@/entities/capability/hooks/useCapabilities';
import { FeatureGate } from '@/entities/capability/ui/FeatureGate';
import { TransactionLifecycleTimeline } from '@/shared/ui/ProgressTimeline';
import { getChainById } from '@/app/config/chains';
import { formatEther } from 'viem';
import { useToast } from '@/shared/hooks/useToast';
import { 
    Search, Layers, Activity, CheckCircle2, 
    XCircle, Info, ExternalLink, Copy, Check, 
    Zap, ShieldCheck, ChevronLeft, ChevronRight,
    Clock, Coins, Network, AlertTriangle, WifiOff, RefreshCw
} from 'lucide-react';

interface RecentActivityProps {
    limit?: number;
    showHeader?: boolean;
}

export const TransactionHistory: React.FC<RecentActivityProps> = ({
    limit,
    showHeader = true
}) => {
    const { currentChainId, smartAccountAddress, isAuthenticated } = useBackendSmartAccount();
    const { toast } = useToast();
    const { capabilities } = useCapabilities();

    // Local filters state (zero duplicate state, directly feeds into hook queries)
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [chainFilter, setChainFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all'); // 'all', '24h', '7d', '30d'
    const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'single', 'batch'
    const [currentPage, setCurrentPage] = useState(1);
    const [copiedText, setCopiedText] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [liveAnnouncement, setLiveAnnouncement] = useState('');
    const [showRawMetadata, setShowRawMetadata] = useState(false);

    // Selected item for details modal
    const [selectedTx, setSelectedTx] = useState<TransactionHistoryItem | null>(null);

    // Monitor connectivity status
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setLiveAnnouncement('Application is back online.');
        };
        const handleOffline = () => {
            setIsOnline(false);
            setLiveAnnouncement('Application is offline. Transaction logs may be out of sync.');
        };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const queryFilters = useMemo(() => {
        const filters: any = {
            page: currentPage,
            limit: limit || 10
        };

        if (statusFilter !== 'all') {
            filters.status = statusFilter;
        }

        if (chainFilter !== 'all') {
            filters.chainId = parseInt(chainFilter);
        }

        if (searchQuery.trim()) {
            filters.search = searchQuery.trim();
        }

        return filters;
    }, [currentPage, statusFilter, chainFilter, searchQuery, limit]);

    // Centralized history query hook (polls automatically if has pending)
    const {
        transactions,
        pagination,
        isLoading,
        error,
        refreshPendingTransactions
    } = useTransactionHistoryBackend(queryFilters);

    // Announces new transactions or updates to screen readers
    useEffect(() => {
        if (transactions.length > 0) {
            setLiveAnnouncement(`Loaded ${transactions.length} transaction records for page ${currentPage}.`);
        }
    }, [transactions, currentPage]);

    // Filter locally by date range and type to keep query simple and robust
    const processedTransactions = useMemo(() => {
        let items = [...transactions];

        // 1. Date Range Filter
        if (dateFilter !== 'all') {
            const now = Date.now();
            const limits: Record<string, number> = {
                '24h': 24 * 60 * 60 * 1000,
                '7d': 7 * 24 * 60 * 60 * 1000,
                '30d': 30 * 24 * 60 * 60 * 1000
            };
            const cutoff = now - (limits[dateFilter] || 0);
            items = items.filter(t => t.timestamp >= cutoff);
        }

        // 2. Transaction Type Filter
        if (typeFilter !== 'all') {
            items = items.filter(t => {
                const isBatch = t.calls && t.calls.length > 1;
                return typeFilter === 'batch' ? isBatch : !isBatch;
            });
        }

        return items;
    }, [transactions, dateFilter, typeFilter]);

    // Deriving analytics metrics directly from backend response items
    const analytics = useMemo(() => {
        const total = pagination.totalCount || transactions.length;
        const success = transactions.filter(t => t.status === 'success').length;
        const failed = transactions.filter(t => t.status === 'failed').length;
        const pending = transactions.filter(t => 
            ['pending', 'queued', 'processing', 'submitted'].includes(t.status)
        ).length;

        // Calculate Average Confirmation Time (from blockchainDuration)
        const confirmedTxs = transactions.filter(t => t.status === 'success' && t.blockchainDuration !== undefined);
        const avgConfirmTime = confirmedTxs.length > 0 
            ? confirmedTxs.reduce((sum, t) => sum + (t.blockchainDuration || 0), 0) / confirmedTxs.length / 1000
            : 0;

        // Calculate Total Gas Sponsored (sum of gasUsed where paymasterID is present)
        const totalGasSponsored = transactions
            .filter(t => t.paymasterID && t.paymasterID !== 'NONE' && t.gasUsed)
            .reduce((sum, t) => {
                try {
                    return sum + parseFloat(t.gasUsed || '0');
                } catch {
                    return sum;
                }
            }, 0);

        // Calculate Total Gas Paid (sum of gasUsed where no paymaster is present)
        const totalGasPaid = transactions
            .filter(t => (!t.paymasterID || t.paymasterID === 'NONE') && t.gasUsed)
            .reduce((sum, t) => {
                try {
                    return sum + parseFloat(t.gasUsed || '0');
                } catch {
                    return sum;
                }
            }, 0);

        // Count unique chain IDs present in the transactions list
        const uniqueChains = new Set(transactions.map(t => t.chainId).filter(Boolean));
        if (uniqueChains.size === 0) {
            uniqueChains.add(currentChainId);
        }

        return {
            total,
            success,
            failed,
            pending,
            avgConfirmTime,
            totalGasSponsored,
            totalGasPaid,
            uniqueChains: uniqueChains.size
        };
    }, [transactions, pagination.totalCount, currentChainId]);

    const chainOptions = useMemo(() => {
        const options = [{ value: 'all', label: 'All Chains' }];
        capabilities?.supportedChains.forEach(c => {
            options.push({
                value: String(c.id),
                label: c.name
            });
        });
        return options;
    }, [capabilities]);

    const statusOptions = [
        { value: 'all', label: 'All Statuses' },
        { value: 'success', label: 'Success' },
        { value: 'failed', label: 'Failed' },
        { value: 'processing', label: 'Processing' },
        { value: 'queued', label: 'Queued' },
        { value: 'submitted', label: 'Submitted' }
    ];

    const dateOptions = [
        { value: 'all', label: 'All Time' },
        { value: '24h', label: 'Last 24 Hours' },
        { value: '7d', label: 'Last 7 Days' },
        { value: '30d', label: 'Last 30 Days' }
    ];

    const typeOptions = [
        { value: 'all', label: 'All Operation Types' },
        { value: 'single', label: 'Single Transfers' },
        { value: 'batch', label: 'Batch Calls' }
    ];

    const handleCopy = (txt: string, label: string) => {
        navigator.clipboard.writeText(txt);
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2000);
        setLiveAnnouncement(`${label} copied to clipboard.`);
        toast({
            title: 'Copied',
            description: `${label} copied to clipboard`,
            variant: 'success'
        });
    };

    const formatValue = (value: string): string => {
        try {
            const ethValue = formatEther(BigInt(value));
            const numValue = parseFloat(ethValue);
            if (numValue === 0) return '0 ETH';
            if (numValue < 0.0001) return '<0.0001 ETH';
            return `${numValue.toFixed(4)} ETH`;
        } catch {
            return '0 ETH';
        }
    };

    const getUsdValue = (value: string): string => {
        try {
            const ethValue = formatEther(BigInt(value));
            const numValue = parseFloat(ethValue);
            const usdVal = numValue * 3200; // Static ETH price matching portfolio adapter
            if (usdVal === 0) return '$0.00';
            if (usdVal < 0.01) return '<$0.01';
            return `$${usdVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } catch {
            return '$0.00';
        }
    };

    const getRelativeTime = (timestamp: number): string => {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        if (diff < 0 || minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const getStatusBadgeStyles = (status: string) => {
        switch (status) {
            case 'success':
                return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
            case 'failed':
                return 'bg-red-500/10 text-red-400 border border-red-500/20';
            case 'processing':
                return 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse';
            case 'submitted':
                return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse';
            case 'queued':
                return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
            case 'retrying':
                return 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse';
            default:
                return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
        }
    };

    return (
        <div className="space-y-8">
            {/* Screen reader announcements live region */}
            <div className="sr-only" aria-live="polite" role="status">
                {liveAnnouncement}
            </div>

            {/* Offline Resilience Indicator banner */}
            {!isOnline && (
                <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs font-semibold">
                    <WifiOff className="w-4 h-4 shrink-0" />
                    <span>You are currently offline. Displayed history is from cache and new status changes cannot sync.</span>
                </div>
            )}

            {/* Unauthorized safety fallback */}
            {!isAuthenticated && (
                <Card className="p-8 text-center border border-amber-500/20 bg-amber-500/5">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <h4 className="font-bold text-slate-100 text-sm">Session Authentication Required</h4>
                    <p className="text-xs text-slate-400 mt-1">Please sign in to your wallet to inspect recent activity history.</p>
                </Card>
            )}

            {isAuthenticated && (
                <>
                    {/* 1. Operations Analytics Dashboard */}
                    {showHeader && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="p-4 bg-slate-900/40 border border-border/60 flex items-center gap-4 transition-all hover:border-primary/30">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Total Transactions</span>
                                    <span className="text-xl font-extrabold text-foreground">{analytics.total}</span>
                                </div>
                            </Card>
                            <Card className="p-4 bg-slate-900/40 border border-border/60 flex items-center gap-4 transition-all hover:border-emerald-500/30">
                                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Successful</span>
                                    <span className="text-xl font-extrabold text-emerald-400">{analytics.success}</span>
                                </div>
                            </Card>
                            <Card className="p-4 bg-slate-900/40 border border-border/60 flex items-center gap-4 transition-all hover:border-red-500/30">
                                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                                    <XCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Failed Ops</span>
                                    <span className="text-xl font-extrabold text-red-400">{analytics.failed}</span>
                                </div>
                            </Card>
                            <Card className="p-4 bg-slate-900/40 border border-border/60 flex items-center gap-4 transition-all hover:border-amber-500/30">
                                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                                    <Layers className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Pending Queue</span>
                                    <span className="text-xl font-extrabold text-amber-400">{analytics.pending}</span>
                                </div>
                            </Card>

                            <Card className="p-4 bg-slate-900/40 border border-border/60 flex items-center gap-4 transition-all hover:border-primary/30">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Avg Confirm Time</span>
                                    <span className="text-xl font-extrabold text-foreground">{analytics.avgConfirmTime.toFixed(1)}s</span>
                                </div>
                            </Card>
                            <Card className="p-4 bg-slate-900/40 border border-border/60 flex items-center gap-4 transition-all hover:border-orange-500/30">
                                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Sponsored Gas</span>
                                    <span className="text-xl font-extrabold text-orange-400">{analytics.totalGasSponsored.toLocaleString()}</span>
                                </div>
                            </Card>
                            <Card className="p-4 bg-slate-900/40 border border-border/60 flex items-center gap-4 transition-all hover:border-indigo-500/30">
                                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                                    <Coins className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Self-Paid Gas</span>
                                    <span className="text-xl font-extrabold text-indigo-400">{analytics.totalGasPaid.toLocaleString()}</span>
                                </div>
                            </Card>
                            <Card className="p-4 bg-slate-900/40 border border-border/60 flex items-center gap-4 transition-all hover:border-teal-500/30">
                                <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0">
                                    <Network className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Active Chains</span>
                                    <span className="text-xl font-extrabold text-teal-400">{analytics.uniqueChains}</span>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* 2. Filters & Toolbar Panel */}
                    <Card className="p-4 bg-slate-900/20 border border-border/80 flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                            <div className="relative md:col-span-2">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-muted-foreground/60" aria-hidden="true" />
                                </span>
                                <Input
                                    type="text"
                                    placeholder="Search by transaction hash or recipient target..."
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                    className="pl-9 h-10 w-full text-sm font-semibold"
                                    aria-label="Search transaction ledger"
                                />
                            </div>

                            <div className="flex md:col-span-2 items-center justify-end gap-3">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => refreshPendingTransactions()}
                                    className="gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground h-9 px-3 border border-border/60 bg-slate-900/50 hover:bg-slate-900"
                                    aria-label="Force synchronize transactions"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Force Sync
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <div>
                                <label className="sr-only" htmlFor="chain-filter">Filter by Network</label>
                                <Select
                                    options={chainOptions}
                                    value={chainFilter}
                                    onChange={(val) => { setChainFilter(val); setCurrentPage(1); }}
                                />
                            </div>
                            <div>
                                <label className="sr-only" htmlFor="status-filter">Filter by Status</label>
                                <Select
                                    options={statusOptions}
                                    value={statusFilter}
                                    onChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                                />
                            </div>
                            <div>
                                <label className="sr-only" htmlFor="date-filter">Filter by Timeframe</label>
                                <Select
                                    options={dateOptions}
                                    value={dateFilter}
                                    onChange={(val) => { setDateFilter(val); setCurrentPage(1); }}
                                />
                            </div>
                            <div>
                                <label className="sr-only" htmlFor="type-filter">Filter by Transfer Type</label>
                                <Select
                                    options={typeOptions}
                                    value={typeFilter}
                                    onChange={(val) => { setTypeFilter(val); setCurrentPage(1); }}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* 3. Transaction Card Ledger */}
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                <span className="text-sm font-semibold text-muted-foreground">Loading smart account transaction history...</span>
                            </div>
                        ) : error ? (
                            <Card className="p-8 border border-red-500/20 bg-red-500/5 text-center">
                                <Info className="w-8 h-8 text-red-500 mx-auto mb-2" />
                                <h4 className="font-bold text-slate-100 text-sm">Failed to Load History</h4>
                                <p className="text-xs text-slate-400 mt-1">{error}</p>
                            </Card>
                        ) : processedTransactions.length === 0 ? (
                            <Card className="p-12 text-center border border-border/40 bg-card/15">
                                <Layers className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
                                <h4 className="font-bold text-slate-200 text-sm">No Transactions Found</h4>
                                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                                    No records matched your search parameters. Try clearing the filters or submit an ERC-4337 Transfer payload.
                                </p>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {processedTransactions.map((tx, idx) => {
                                        const chainConfig = getChainById(tx.chainId || currentChainId);
                                        const explorerUrl = chainConfig?.blockExplorer && tx.hash ? `${chainConfig.blockExplorer}/tx/${tx.hash}` : null;
                                        const isBatch = tx.calls && tx.calls.length > 1;

                                        return (
                                            <motion.div
                                                key={tx.id || tx.hash || idx}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ duration: 0.15, delay: Math.min(idx * 0.02, 0.15) }}
                                            >
                                                <Card className="p-4 bg-slate-900/40 hover:bg-slate-900/75 border border-border/80 hover:border-primary/50 transition-all duration-150 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                                        <div className="mt-1 shrink-0">
                                                            {tx.status === 'success' ? (
                                                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                            ) : tx.status === 'failed' ? (
                                                                <XCircle className="w-5 h-5 text-red-500" />
                                                            ) : (
                                                                <Activity className="w-5 h-5 text-blue-500 animate-pulse" />
                                                            )}
                                                        </div>
                                                        <div className="space-y-2 flex-1 min-w-0">
                                                            {/* Headers and Indicators */}
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${getStatusBadgeStyles(tx.status)}`}>
                                                                    {tx.status}
                                                                </span>

                                                                {/* Sponsored Badges & Batch Indicators */}
                                                                {tx.paymasterID && tx.paymasterID !== 'NONE' ? (
                                                                    <FeatureGate feature="gasSponsorship">
                                                                        <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] font-bold">
                                                                            Sponsored
                                                                        </span>
                                                                    </FeatureGate>
                                                                ) : (
                                                                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-semibold">
                                                                        Self-funded
                                                                    </span>
                                                                )}

                                                                {isBatch && (
                                                                    <FeatureGate feature="batching">
                                                                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold">
                                                                            Batch ({tx.calls?.length})
                                                                        </span>
                                                                    </FeatureGate>
                                                                )}

                                                                <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1.5">
                                                                    <span>{new Date(tx.timestamp).toLocaleString()}</span>
                                                                    <span>•</span>
                                                                    <span className="text-slate-400 font-medium">{getRelativeTime(tx.timestamp)}</span>
                                                                </span>
                                                            </div>

                                                            {/* Address and Asset Ledger */}
                                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold text-slate-300">
                                                                <div>
                                                                    <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider">Sender</span>
                                                                    <div className="flex items-center gap-1 mt-0.5">
                                                                        <span className="font-mono text-slate-200 truncate max-w-[120px]">
                                                                            {smartAccountAddress ? `${smartAccountAddress.slice(0, 6)}...${smartAccountAddress.slice(-4)}` : 'Smart Account'}
                                                                        </span>
                                                                        <button 
                                                                            onClick={() => handleCopy(smartAccountAddress || '', 'Sender address')} 
                                                                            className="text-muted-foreground hover:text-slate-200 transition-colors"
                                                                            title="Copy Sender Address"
                                                                            aria-label="Copy sender address"
                                                                        >
                                                                            <Copy className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider">Recipient Target</span>
                                                                    <div className="flex items-center gap-1 mt-0.5">
                                                                        <span className="font-mono text-slate-200 truncate max-w-[120px]">
                                                                            {tx.to ? `${tx.to.slice(0, 6)}...${tx.to.slice(-4)}` : 'Batch Contract'}
                                                                        </span>
                                                                        {tx.to && (
                                                                            <button 
                                                                                onClick={() => handleCopy(tx.to, 'Recipient address')} 
                                                                                className="text-muted-foreground hover:text-slate-200 transition-colors"
                                                                                title="Copy Recipient Address"
                                                                                aria-label="Copy recipient address"
                                                                            >
                                                                                <Copy className="w-3 h-3" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider">Asset Value</span>
                                                                    <div className="mt-0.5 flex flex-col">
                                                                        <span className="font-mono text-slate-100 font-bold">{formatValue(tx.value)}</span>
                                                                        <span className="text-[10px] text-muted-foreground">{getUsdValue(tx.value)}</span>
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider">Chain / Network</span>
                                                                    <span className="mt-1 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-slate-300 font-mono text-[10px] w-fit block">
                                                                        {chainConfig?.name || `Chain ${tx.chainId || currentChainId}`}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Card Actions */}
                                                    <div className="flex items-center gap-2 self-end lg:self-center shrink-0 w-full lg:w-auto justify-end border-t border-slate-800 lg:border-t-0 pt-3 lg:pt-0">
                                                        {tx.status === 'retrying' && (
                                                            <div className="text-[10px] text-amber-400 font-bold animate-pulse flex items-center gap-1 mr-2">
                                                                <RefreshCw className="w-3 h-3 animate-spin" />
                                                                <span>Retry Attempt #{tx.retryCount || 1}...</span>
                                                            </div>
                                                        )}

                                                        {explorerUrl && (
                                                            <a
                                                                href={explorerUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-2 rounded-lg hover:bg-slate-800 border border-border/80 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
                                                                title="View transaction on Block Explorer"
                                                                aria-label="Open block explorer"
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => { setSelectedTx(tx); setShowRawMetadata(false); }}
                                                            className="text-xs font-bold px-3 h-9 border-border/80 text-muted-foreground hover:text-foreground bg-slate-900/50 hover:bg-slate-900"
                                                            aria-label="Inspect transaction operational details"
                                                        >
                                                            Inspect
                                                        </Button>
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>

                    {/* 4. Dynamic Pagination controls */}
                    {!isLoading && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-border/40 pt-4 text-xs font-semibold">
                            <span className="text-muted-foreground">
                                Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total items)
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    className="h-8 p-1.5 border-border/80 text-muted-foreground bg-slate-900/50 hover:bg-slate-900 disabled:opacity-50"
                                    aria-label="Go to previous page"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === pagination.totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                                    className="h-8 p-1.5 border-border/80 text-muted-foreground bg-slate-900/50 hover:bg-slate-900 disabled:opacity-50"
                                    aria-label="Go to next page"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* 5. Accessible Inspect overlay Dialogue drawer */}
                    <Dialog open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
                        {selectedTx && (
                            <DialogContent className="max-w-lg bg-slate-950 border border-slate-800 p-6 rounded-xl shadow-2xl text-slate-100 animate-fade-in max-h-[90vh] overflow-y-auto">
                                <DialogHeader className="mb-4">
                                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                                        <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                                        Operation Inspector
                                    </DialogTitle>
                                    <DialogDescription className="text-slate-400 text-xs">
                                        Verify smart account gas sponsoring, bundler nodes, confirmation duration times, and execution payloads.
                                    </DialogDescription>
                                </DialogHeader>

                                {/* Complete live execution lifecycle timeline */}
                                <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl mb-4">
                                    <h4 className="font-bold text-[10px] uppercase text-muted-foreground tracking-wider mb-4">
                                        Lifecycle Trace
                                    </h4>
                                    <TransactionLifecycleTimeline
                                        status={selectedTx.status}
                                        hash={selectedTx.hash}
                                        failureReason={selectedTx.failureReason}
                                        gasUsed={selectedTx.gasUsed}
                                    />
                                </div>

                                {/* General detailed specifications list */}
                                <div className="divide-y divide-slate-800/80 text-xs font-semibold bg-slate-900/20 px-3 rounded-lg border border-slate-800/50 mb-4">
                                    <div className="py-2.5 flex justify-between">
                                        <span className="text-slate-400">Database operation ID</span>
                                        <span className="font-mono text-slate-100 truncate max-w-[200px]" title={selectedTx.id}>
                                            {selectedTx.id}
                                        </span>
                                    </div>
                                    
                                    {selectedTx.hash && (
                                        <div className="py-2.5 flex justify-between items-center">
                                            <span className="text-slate-400">Transaction Hash</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono text-slate-100 truncate max-w-[200px]">{selectedTx.hash}</span>
                                                <button onClick={() => handleCopy(selectedTx.hash || '', 'Transaction hash')} className="text-slate-400 hover:text-white" aria-label="Copy transaction hash">
                                                    {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {selectedTx.userOpHash && (
                                        <div className="py-2.5 flex justify-between items-center">
                                            <span className="text-slate-400">UserOperation Hash</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono text-slate-100 truncate max-w-[200px]">{selectedTx.userOpHash}</span>
                                                <button onClick={() => handleCopy(selectedTx.userOpHash || '', 'UserOperation hash')} className="text-slate-400 hover:text-white" aria-label="Copy UserOperation hash">
                                                    {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="py-2.5 flex justify-between">
                                        <span className="text-slate-400">Target Recipient</span>
                                        <span className="font-mono text-slate-100 truncate max-w-[200px]">{selectedTx.to || 'Batch Execution contract'}</span>
                                    </div>

                                    <div className="py-2.5 flex justify-between">
                                        <span className="text-slate-400">Transferred Value</span>
                                        <span className="font-mono text-slate-100 font-bold">{formatValue(selectedTx.value)}</span>
                                    </div>

                                    <div className="py-2.5 flex justify-between">
                                        <span className="text-slate-400">USD Equivalence</span>
                                        <span className="font-mono text-slate-100 font-bold">{getUsdValue(selectedTx.value)}</span>
                                    </div>

                                    {/* Operational durations / confirmation speeds */}
                                    <div className="py-2.5 flex justify-between">
                                        <span className="text-slate-400">Queue Time Duration</span>
                                        <span className="text-slate-100">
                                            {selectedTx.queueDuration !== undefined ? `${(selectedTx.queueDuration / 1000).toFixed(2)}s` : 'N/A'}
                                        </span>
                                    </div>

                                    <div className="py-2.5 flex justify-between">
                                        <span className="text-slate-400">Blockchain Invalidation Duration</span>
                                        <span className="text-slate-100">
                                            {selectedTx.blockchainDuration !== undefined ? `${(selectedTx.blockchainDuration / 1000).toFixed(2)}s` : 'N/A'}
                                        </span>
                                    </div>

                                    <div className="py-2.5 flex justify-between">
                                        <span className="text-slate-400">Total Execution Duration</span>
                                        <span className="text-slate-100">
                                            {selectedTx.executionDuration !== undefined ? `${(selectedTx.executionDuration / 1000).toFixed(2)}s` : 'N/A'}
                                        </span>
                                    </div>

                                    {/* Feature Gated Capabilities specifications */}
                                    <FeatureGate feature="gasSponsorship">
                                        <div className="py-2.5 flex justify-between">
                                            <span className="text-slate-400">Gas Sponsorship / Paymaster</span>
                                            <span className="text-slate-100 font-bold uppercase">
                                                {selectedTx.paymasterID && selectedTx.paymasterID !== 'NONE' ? selectedTx.paymasterID : 'None (Self-paid)'}
                                            </span>
                                        </div>
                                    </FeatureGate>

                                    <div className="py-2.5 flex justify-between">
                                        <span className="text-slate-400">Bundler node network</span>
                                        <span className="text-slate-100 uppercase">{selectedTx.bundlerID || 'ALCHEMY'}</span>
                                    </div>

                                    <FeatureGate feature="sessionKeys">
                                        <div className="py-2.5 flex justify-between">
                                            <span className="text-slate-400">Session Key used</span>
                                            <span className="text-slate-400 italic">Default Admin ECDSA Signature</span>
                                        </div>
                                    </FeatureGate>

                                    {selectedTx.gasUsed && (
                                        <div className="py-2.5 flex justify-between">
                                            <span className="text-slate-400">Actual Gas Consumed</span>
                                            <span className="font-mono text-slate-100">{selectedTx.gasUsed} gas units</span>
                                        </div>
                                    )}

                                    {selectedTx.retryCount !== undefined && selectedTx.retryCount > 0 && (
                                        <div className="py-2.5 flex justify-between">
                                            <span className="text-slate-400">Retry Attempts</span>
                                            <span className="text-amber-400 font-bold">{selectedTx.retryCount} times</span>
                                        </div>
                                    )}
                                </div>

                                {/* Revert/Failure explanations */}
                                {selectedTx.failureReason && (
                                    <div className="mb-4 flex flex-col gap-1 text-red-400 bg-red-500/5 p-3 rounded-lg border border-red-500/25">
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Revert Error Trace</span>
                                        <p className="font-mono font-medium text-xs leading-normal">{selectedTx.failureReason}</p>
                                    </div>
                                )}

                                {/* Batch calls detailed sublist inside details modal */}
                                {selectedTx.calls && selectedTx.calls.length > 0 && (
                                    <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl mb-4">
                                        <h4 className="font-bold text-[10px] uppercase text-muted-foreground tracking-wider mb-2">
                                            Batch Calls Sub-operations ({selectedTx.calls.length})
                                        </h4>
                                        <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                            {selectedTx.calls.map((call, cIdx) => (
                                                <div key={cIdx} className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] font-semibold space-y-1">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-slate-400">To target:</span>
                                                        <span className="font-mono text-slate-100 truncate max-w-[200px]" title={call.to}>{call.to}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-slate-400">Value transferred:</span>
                                                        <span className="font-mono text-slate-200">{formatValue(call.value)}</span>
                                                    </div>
                                                    {call.data && call.data !== '0x' && (
                                                        <div className="flex flex-col gap-0.5 mt-1 border-t border-slate-900 pt-1">
                                                            <span className="text-slate-400 text-[10px]">Data bytes:</span>
                                                            <span className="font-mono text-slate-400 break-all text-[9px]">{call.data}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Raw JSON disclosure */}
                                <div className="border-t border-slate-800 pt-4">
                                    <button
                                        onClick={() => setShowRawMetadata(!showRawMetadata)}
                                        className="text-xs text-primary hover:text-primary-hover font-bold flex items-center gap-1.5 transition-colors"
                                        aria-expanded={showRawMetadata}
                                    >
                                        <span>{showRawMetadata ? 'Hide Raw Metadata JSON' : 'Show Raw Metadata JSON'}</span>
                                    </button>

                                    {showRawMetadata && (
                                        <pre className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 font-mono text-[10px] text-emerald-400/90 mt-2 overflow-x-auto max-h-40">
                                            {JSON.stringify(selectedTx, null, 2)}
                                        </pre>
                                    )}
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => setSelectedTx(null)}
                                        className="border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white"
                                        aria-label="Close Inspector drawer"
                                    >
                                        Close Details
                                    </Button>
                                </div>
                            </DialogContent>
                        )}
                    </Dialog>
                </>
            )}
        </div>
    );
};