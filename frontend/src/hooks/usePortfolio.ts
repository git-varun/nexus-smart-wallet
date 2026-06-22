import { useCallback, useEffect, useState } from 'react';
import { useBackendSmartAccount } from './useBackendSmartAccount';
import { useToast } from './useToast';
import { apiClient } from '../services/apiClient';

export interface PortfolioAsset {
    type: 'native' | 'erc20' | 'erc721' | 'erc1155';
    tokenAddress?: string;
    tokenId?: string;
    symbol?: string;
    name?: string;
    decimals?: number;
    balance: string;
    metadata?: Record<string, any>;
}

export function usePortfolio() {
    const { smartAccountAddress, token, currentChainId } = useBackendSmartAccount();
    const { toast } = useToast();
    const [assets, setAssets] = useState<PortfolioAsset[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchPortfolio = useCallback(async (silent = false) => {
        if (!smartAccountAddress || !token) return;

        if (!silent) setIsLoading(true);
        try {
            const response = await apiClient.getPortfolio(token, smartAccountAddress, currentChainId);
            if (response.success && response.data?.portfolio) {
                setAssets(response.data.portfolio.assets || []);
            } else {
                throw new Error(response.error?.message || 'Failed to fetch portfolio');
            }
        } catch (error) {
            console.error('Failed to fetch portfolio:', error);
            if (!silent) {
                toast({
                    title: 'Portfolio Error',
                    description: error instanceof Error ? error.message : 'Could not fetch portfolio',
                    variant: 'error'
                });
            }
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [smartAccountAddress, token, currentChainId, toast]);

    const refreshPortfolio = useCallback(async () => {
        if (!smartAccountAddress || !token) return;

        setIsRefreshing(true);
        try {
            const response = await apiClient.refreshPortfolio(token, smartAccountAddress, currentChainId);
            if (response.success && response.data?.portfolio) {
                setAssets(response.data.portfolio.assets || []);
                toast({
                    title: 'Portfolio Refreshed',
                    description: 'Your assets have been updated successfully',
                    variant: 'success'
                });
            } else {
                throw new Error(response.error?.message || 'Failed to refresh portfolio');
            }
        } catch (error) {
            console.error('Failed to refresh portfolio:', error);
            toast({
                title: 'Refresh Failed',
                description: error instanceof Error ? error.message : 'Could not refresh portfolio',
                variant: 'error'
            });
        } finally {
            setIsRefreshing(false);
        }
    }, [smartAccountAddress, token, currentChainId, toast]);

    useEffect(() => {
        if (smartAccountAddress) {
            fetchPortfolio();
        } else {
            setAssets([]);
        }
    }, [smartAccountAddress, currentChainId, fetchPortfolio]);

    const nativeAsset = assets.find(a => a.type === 'native');
    const erc20Assets = assets.filter(a => a.type === 'erc20');
    const nftAssets = assets.filter(a => a.type === 'erc721' || a.type === 'erc1155');

    return {
        assets,
        nativeAsset,
        erc20Assets,
        nftAssets,
        isLoading,
        isRefreshing,
        fetchPortfolio,
        refreshPortfolio
    };
}
