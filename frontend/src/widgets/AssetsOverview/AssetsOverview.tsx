import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Page, Card } from '@/app/layouts/Layout';
import { Table, THead, TBody, TR, TH, TD } from '@/shared/ui/Table';
import { StateView } from '@/shared/ui/StateView';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/ui/Dialog';
import { Chart } from '@/shared/ui/Chart';
import { usePortfolio } from '@/entities/portfolio/hooks/usePortfolio';
import { useBackendSmartAccount } from '@/entities/wallet/hooks/useBackendSmartAccount';
import { SUPPORTED_CHAINS, getChainById } from '@/app/config/chains';
import { Asset } from '@/entities/portfolio/model/adapter';
import { 
    Grid, List, Search, ExternalLink, 
    Copy, Check, Eye, RefreshCw 
} from 'lucide-react';

export const AssetsOverview: React.FC = () => {
    const { 
        assets, 
        totalValueUsd, 
        isLoading, 
        isRefreshing, 
        refreshPortfolio 
    } = usePortfolio();

    const { currentChainId, smartAccountAddress } = useBackendSmartAccount();

    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [selectedChainId, setSelectedChainId] = useState('all');
    const [sortBy, setSortBy] = useState<'value' | 'balance' | 'name'>('value');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    
    // Modal Details State
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [copiedAddress, setCopiedAddress] = useState(false);

    // Copy to clipboard helper
    const handleCopyAddress = (address: string) => {
        navigator.clipboard.writeText(address);
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
    };

    // Format balances nicely
    const formatBalance = useCallback((asset: Asset) => {
        if (asset.type === 'native' || asset.type === 'erc20') {
            try {
                const raw = BigInt(asset.balance);
                const formatted = Number(raw) / Math.pow(10, asset.decimals);
                if (formatted === 0) return '0.00';
                if (formatted < 0.0001) return '< 0.0001';
                return formatted.toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 6 
                });
            } catch {
                const parsed = parseFloat(asset.balance);
                return isNaN(parsed) ? '0.00' : parsed.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4
                });
            }
        }
        return asset.balance; // NFTs / Collections
    }, []);

    // Filter and Sort Assets (derived state, 0 state duplication)
    const processedAssets = useMemo(() => {
        let result = [...assets];

        // 1. Search Query filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                a => a.name.toLowerCase().includes(query) || a.symbol.toLowerCase().includes(query)
            );
        }

        // 2. Asset Type filter
        if (selectedType !== 'all') {
            if (selectedType === 'nft') {
                result = result.filter(a => a.type === 'erc721' || a.type === 'erc1155');
            } else {
                result = result.filter(a => a.type === selectedType);
            }
        }

        // 3. Chain filter (find out chainId from backend metadata or fallback to default if not mapped)
        if (selectedChainId !== 'all') {
            const targetChainId = parseInt(selectedChainId);
            // Native assets assume current chain, ERC20 check contract or metadata (all assets on active chain)
            // Let's verify: syncPortfolio saves assets per chainId. So all assets returned by usePortfolio are on the currentChainId.
            // If the user selects a chain different from currentChainId, they might get empty list. That is correct!
            // But we can filter by it safely.
            result = result.filter(() => currentChainId === targetChainId);
        }

        // 4. Sorting
        result.sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'value') {
                comparison = (a.valueUsd || 0) - (b.valueUsd || 0);
            } else if (sortBy === 'balance') {
                const balA = parseFloat(a.balance) / Math.pow(10, a.decimals);
                const balB = parseFloat(b.balance) / Math.pow(10, b.decimals);
                comparison = (isNaN(balA) ? 0 : balA) - (isNaN(balB) ? 0 : balB);
            } else if (sortBy === 'name') {
                comparison = a.name.localeCompare(b.name);
            }

            return sortOrder === 'desc' ? -comparison : comparison;
        });

        return result;
    }, [assets, searchQuery, selectedType, selectedChainId, sortBy, sortOrder, currentChainId]);

    // Data for shared donut chart (Allocation)
    const allocationData = useMemo(() => {
        const valueAssets = assets.filter(
            a => (a.type === 'native' || a.type === 'erc20') && (a.valueUsd || 0) > 0
        );
        if (valueAssets.length === 0) return [];
        
        // Sum total for percentage calculation
        const total = valueAssets.reduce((sum, a) => sum + (a.valueUsd || 0), 0);

        return valueAssets.map(a => ({
            name: a.symbol,
            value: a.valueUsd || 0,
            percentage: total > 0 ? ((a.valueUsd || 0) / total) * 100 : 0
        })).sort((a, b) => b.value - a.value);
    }, [assets]);

    // Available Chains for Filter (drawn from SUPPORTED_CHAINS)
    const chainOptions = useMemo(() => {
        const options = [{ value: 'all', label: 'All Chains' }];
        Object.values(SUPPORTED_CHAINS).forEach(chain => {
            options.push({
                value: String(chain.chainId),
                label: chain.displayName
            });
        });
        return options;
    }, []);

    // Asset type options
    const typeOptions = [
        { value: 'all', label: 'All Types' },
        { value: 'native', label: 'Native Coins' },
        { value: 'erc20', label: 'ERC-20 Tokens' },
        { value: 'nft', label: 'Collectibles (NFT)' }
    ];

    // Sort criteria options
    const sortOptions = [
        { value: 'value', label: 'Sort by Value' },
        { value: 'balance', label: 'Sort by Balance' },
        { value: 'name', label: 'Sort by Name' }
    ];

    const sortOrderOptions = [
        { value: 'desc', label: 'High to Low' },
        { value: 'asc', label: 'Low to High' }
    ];

    const activeChain = getChainById(currentChainId);

    const handleRefreshClick = () => {
        refreshPortfolio();
    };

    const isChartEmpty = allocationData.length === 0;

    return (
        <Page
            title="Portfolio Assets"
            description="Reconcile and manage your smart account token balances and collectible assets."
            breadcrumbs={['Home', 'Assets']}
            actions={
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        loading={isRefreshing}
                        onClick={handleRefreshClick}
                        className="h-9 px-3 gap-1.5"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Sync Balances
                    </Button>
                </div>
            }
            loading={isLoading}
        >
            <div className="space-y-8">
                {/* 1. Portfolio Allocation Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                    <div className="lg:col-span-2">
                        <BalanceOverviewCard 
                            totalValueUsd={totalValueUsd}
                            assets={assets}
                            currentChainName={activeChain?.displayName || 'Active Network'}
                            smartAccountAddress={smartAccountAddress || '0x0'}
                        />
                    </div>
                    <div>
                        <Card className="h-full flex flex-col justify-between p-5 bg-card/40 border-border/80">
                            <div>
                                <h4 className="font-bold text-foreground text-sm uppercase tracking-wider text-muted-foreground mb-4">
                                    Token Allocation
                                </h4>
                                <div className="h-[180px] flex items-center justify-center">
                                    <Chart
                                        type="donut"
                                        data={allocationData}
                                        keys={['value']}
                                        xAxisKey="name"
                                        height={160}
                                        empty={isChartEmpty}
                                    />
                                </div>
                            </div>
                            {!isChartEmpty && (
                                <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold max-h-[80px] overflow-y-auto pr-1">
                                    {allocationData.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between gap-1.5">
                                            <span className="text-muted-foreground truncate">{item.name}</span>
                                            <span className="font-mono text-foreground shrink-0">{item.percentage.toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>
                </div>

                {/* 2. Search, Filters, and Controls Toolbar */}
                <Card className="p-4 bg-card/30 border border-border/60 shadow-sm flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        {/* Search Query */}
                        <div className="relative md:col-span-2">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-muted-foreground/60" />
                            </span>
                            <Input
                                type="text"
                                placeholder="Search by name or ticker..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-10 w-full"
                            />
                        </div>

                        {/* View Switcher and Refresh info */}
                        <div className="flex md:col-span-2 items-center justify-end gap-3">
                            <div className="flex items-center gap-1 border border-border/80 p-0.5 rounded-lg bg-card/60">
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`p-1.5 rounded-md transition-colors ${
                                        viewMode === 'table' 
                                            ? 'bg-primary text-primary-foreground' 
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                    title="Table View"
                                >
                                    <List className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-md transition-colors ${
                                        viewMode === 'grid' 
                                            ? 'bg-primary text-primary-foreground' 
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                    title="Grid View"
                                >
                                    <Grid className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Chain filter */}
                        <div>
                            <Select
                                options={chainOptions}
                                value={selectedChainId}
                                onChange={setSelectedChainId}
                            />
                        </div>

                        {/* Type filter */}
                        <div>
                            <Select
                                options={typeOptions}
                                value={selectedType}
                                onChange={setSelectedType}
                            />
                        </div>

                        {/* Sort field */}
                        <div>
                            <Select
                                options={sortOptions}
                                value={sortBy}
                                onChange={(val) => setSortBy(val as 'value' | 'balance' | 'name')}
                            />
                        </div>

                        {/* Sort order */}
                        <div>
                            <Select
                                options={sortOrderOptions}
                                value={sortOrder}
                                onChange={(val) => setSortOrder(val as 'desc' | 'asc')}
                            />
                        </div>
                    </div>
                </Card>

                {/* 3. Assets Presentation List */}
                <AnimatePresence mode="wait">
                    {processedAssets.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            <StateView
                                type="empty"
                                title="No Matching Assets"
                                description="Try adjusting your search queries or selecting another chain/token filter."
                            />
                        </motion.div>
                    ) : viewMode === 'grid' ? (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {processedAssets.map((asset, idx) => (
                                <AssetGridCard
                                    key={`${asset.tokenAddress}-${asset.tokenId || idx}`}
                                    asset={asset}
                                    formattedBalance={formatBalance(asset)}
                                    onViewDetails={() => setSelectedAsset(asset)}
                                    index={idx}
                                />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="table"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <Card className="p-0 overflow-hidden border border-border/80">
                                <Table>
                                    <THead>
                                        <TR>
                                            <TH>Asset</TH>
                                            <TH className="text-right">Balance</TH>
                                            <TH className="text-right">Price</TH>
                                            <TH className="text-right">Value (USD)</TH>
                                            <TH className="text-right">Action</TH>
                                        </TR>
                                    </THead>
                                    <TBody>
                                        {processedAssets.map((asset, idx) => (
                                            <AssetTableRow
                                                key={`${asset.tokenAddress}-${asset.tokenId || idx}`}
                                                asset={asset}
                                                formattedBalance={formatBalance(asset)}
                                                onViewDetails={() => setSelectedAsset(asset)}
                                            />
                                        ))}
                                    </TBody>
                                </Table>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 4. Asset Details Dialog Panel */}
                <Dialog open={!!selectedAsset} onOpenChange={(open) => !open && setSelectedAsset(null)}>
                    {selectedAsset && (
                        <DialogContent className="max-w-md bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-xl text-slate-100 animate-fade-in">
                            <DialogHeader className="mb-4">
                                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                                        {selectedAsset.symbol.slice(0, 2)}
                                    </div>
                                    <div>
                                        <h3 className="text-white text-lg">{selectedAsset.name}</h3>
                                        <p className="text-xs text-slate-400 font-semibold">{selectedAsset.symbol}</p>
                                    </div>
                                </DialogTitle>
                                <DialogDescription className="text-slate-400 text-xs mt-1">
                                    Full metadata information and ledger specs.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 text-sm font-semibold">
                                {/* NFT Image preview */}
                                {selectedAsset.metadata?.image && (
                                    <div className="aspect-square w-full rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
                                        <img 
                                            src={selectedAsset.metadata.image} 
                                            alt={selectedAsset.name}
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    </div>
                                )}

                                <div className="divide-y divide-slate-800">
                                    <div className="py-2.5 flex justify-between">
                                        <span className="text-slate-400">Asset Type</span>
                                        <span className="capitalize text-slate-100">{selectedAsset.type}</span>
                                    </div>
                                    <div className="py-2.5 flex justify-between">
                                        <span className="text-slate-400">On-Chain Balance</span>
                                        <span className="font-mono text-slate-100">{formatBalance(selectedAsset)} {selectedAsset.symbol}</span>
                                    </div>
                                    <div className="py-2.5 flex justify-between">
                                        <span className="text-slate-400">USD Price</span>
                                        <span className="font-mono text-slate-100">
                                            {selectedAsset.priceUsd ? `$${selectedAsset.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                                        </span>
                                    </div>
                                    <div className="py-2.5 flex justify-between">
                                        <span className="text-slate-400">USD Valuation</span>
                                        <span className="font-mono text-slate-100 font-bold">
                                            {selectedAsset.valueUsd ? `$${selectedAsset.valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                                        </span>
                                    </div>
                                    
                                    {selectedAsset.tokenId && (
                                        <div className="py-2.5 flex justify-between">
                                            <span className="text-slate-400">Token ID</span>
                                            <span className="font-mono text-slate-100">{selectedAsset.tokenId}</span>
                                        </div>
                                    )}

                                    {selectedAsset.tokenAddress && selectedAsset.type !== 'native' && (
                                        <div className="py-2.5 flex flex-col gap-1.5">
                                            <span className="text-slate-400">Contract Address</span>
                                            <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800 font-mono text-xs">
                                                <span className="truncate max-w-[240px] text-slate-300">{selectedAsset.tokenAddress}</span>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleCopyAddress(selectedAsset.tokenAddress)}
                                                        className="text-slate-400 hover:text-white transition-colors"
                                                    >
                                                        {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                    </button>
                                                    {activeChain?.blockExplorer && (
                                                        <a
                                                            href={`${activeChain.blockExplorer}/address/${selectedAsset.tokenAddress}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-slate-400 hover:text-white transition-colors"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {selectedAsset.metadata?.description && (
                                        <div className="py-2.5 flex flex-col gap-1.5">
                                            <span className="text-slate-400">Description</span>
                                            <p className="text-xs text-slate-300 leading-relaxed font-normal">
                                                {selectedAsset.metadata.description}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="mt-6 flex justify-end">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setSelectedAsset(null)}
                                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                                >
                                    Close Details
                                </Button>
                            </div>
                        </DialogContent>
                    )}
                </Dialog>
            </div>
        </Page>
    );
};

/* --- SUB COMPONENTS --- */

interface BalanceOverviewCardProps {
    totalValueUsd: number;
    assets: Asset[];
    currentChainName: string;
    smartAccountAddress: string;
}

const BalanceOverviewCard: React.FC<BalanceOverviewCardProps> = ({
    totalValueUsd,
    assets,
    currentChainName,
    smartAccountAddress
}) => {
    const erc20Count = assets.filter(a => a.type === 'erc20').length;
    const nftCount = assets.filter(a => a.type === 'erc721' || a.type === 'erc1155').length;

    return (
        <Card className="h-full p-6 bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-900/40 backdrop-blur-sm border border-border/80 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-1">
                <span className="text-xs font-bold text-primary uppercase tracking-wider block">
                    Consolidated Net Worth
                </span>
                <h1 className="text-4xl font-extrabold text-foreground tracking-tight leading-none py-1">
                    ${totalValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h1>
                <p className="text-xs text-muted-foreground font-semibold">
                    Consolidated multichain valuation synced on <span className="text-foreground">{currentChainName}</span>
                </p>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-border/40 pt-5 text-center">
                <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-0.5">Wallet Address</span>
                    <span className="text-xs font-bold text-foreground font-mono">
                        {smartAccountAddress.slice(0, 6)}...{smartAccountAddress.slice(-4)}
                    </span>
                </div>
                <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-0.5">ERC-20 Tokens</span>
                    <span className="text-xs font-bold text-foreground">{erc20Count} tokens</span>
                </div>
                <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-0.5">Collectibles</span>
                    <span className="text-xs font-bold text-foreground">{nftCount} items</span>
                </div>
            </div>
        </Card>
    );
};

interface AssetGridCardProps {
    asset: Asset;
    formattedBalance: string;
    onViewDetails: () => void;
    index: number;
}

const AssetGridCard: React.FC<AssetGridCardProps> = ({
    asset,
    formattedBalance,
    onViewDetails,
    index
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            whileHover={{ y: -3 }}
            className="h-full"
        >
            <Card className="p-5 flex flex-col justify-between h-full bg-card/60 backdrop-blur-sm border border-border/80 hover:border-primary/50 transition-all duration-200">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        {asset.metadata?.image ? (
                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-border/40 overflow-hidden flex items-center justify-center shrink-0">
                                <img src={asset.metadata.image} alt={asset.name} className="max-h-full max-w-full object-cover" />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-sm text-primary shrink-0">
                                {asset.symbol.slice(0, 2)}
                            </div>
                        )}
                        <div>
                            <h4 className="font-bold text-foreground text-sm leading-snug truncate max-w-[140px]" title={asset.name}>
                                {asset.name}
                            </h4>
                            <span className="text-xs text-muted-foreground font-bold uppercase">{asset.type}</span>
                        </div>
                    </div>
                    {asset.priceUsd ? (
                        <span className="text-xs font-mono text-muted-foreground font-semibold">
                            ${asset.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    ) : null}
                </div>

                <div className="mt-6 flex items-end justify-between">
                    <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Balance</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-extrabold text-foreground font-mono leading-none truncate max-w-[120px]" title={formattedBalance}>
                                {formattedBalance}
                            </span>
                            <span className="text-xs text-muted-foreground font-bold">{asset.symbol}</span>
                        </div>
                        {asset.valueUsd !== undefined && asset.valueUsd > 0 && (
                            <p className="text-xs text-muted-foreground font-mono font-medium">
                                ~${asset.valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        )}
                    </div>

                    <Button 
                        onClick={onViewDetails} 
                        size="sm" 
                        variant="outline" 
                        className="h-8 py-0.5 px-2.5 rounded-lg text-xs font-bold gap-1 border-border/80 text-muted-foreground hover:text-foreground"
                    >
                        View <Eye className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </Card>
        </motion.div>
    );
};

interface AssetTableRowProps {
    asset: Asset;
    formattedBalance: string;
    onViewDetails: () => void;
}

const AssetTableRow: React.FC<AssetTableRowProps> = ({
    asset,
    formattedBalance,
    onViewDetails
}) => {
    return (
        <TR className="hover:bg-muted/10 transition-colors">
            <TD className="font-semibold text-foreground">
                <div className="flex items-center gap-3">
                    {asset.metadata?.image ? (
                        <div className="w-8 h-8 rounded-lg bg-slate-900 border border-border/40 overflow-hidden flex items-center justify-center shrink-0">
                            <img src={asset.metadata.image} alt={asset.name} className="max-h-full max-w-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                            {asset.symbol.slice(0, 2)}
                        </div>
                    )}
                    <div>
                        <div className="font-bold text-foreground text-sm">{asset.name}</div>
                        <div className="text-xs text-muted-foreground uppercase flex items-center gap-1.5">
                            <span>{asset.symbol}</span>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span>{asset.type}</span>
                        </div>
                    </div>
                </div>
            </TD>
            <TD className="text-right font-mono text-foreground font-bold">
                {formattedBalance} <span className="text-[10px] text-muted-foreground font-sans font-bold">{asset.symbol}</span>
            </TD>
            <TD className="text-right font-mono text-muted-foreground">
                {asset.priceUsd && (asset.type === 'native' || asset.type === 'erc20') 
                    ? `$${asset.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}` 
                    : '—'}
            </TD>
            <TD className="text-right font-mono text-foreground font-extrabold">
                {asset.valueUsd && (asset.type === 'native' || asset.type === 'erc20') 
                    ? `$${asset.valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}` 
                    : '—'}
            </TD>
            <TD className="text-right">
                <Button 
                    onClick={onViewDetails} 
                    size="sm" 
                    variant="outline" 
                    className="h-8 py-0.5 px-2.5 rounded-lg text-xs font-bold gap-1 border-border/80 text-muted-foreground hover:text-foreground inline-flex"
                >
                    Details <Eye className="w-3.5 h-3.5" />
                </Button>
            </TD>
        </TR>
    );
};
