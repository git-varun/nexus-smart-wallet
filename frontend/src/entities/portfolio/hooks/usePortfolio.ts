import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackendSmartAccount } from '@/entities/wallet/hooks/useBackendSmartAccount';
import { useToast } from '@/shared/hooks/useToast';
import { apiClient } from '@/services/apiClient';
import { QUERY_KEYS, QUERY_TIMES, MUTATION_KEYS } from '@/shared/lib/reactQuery';

export function usePortfolio() {
    const { smartAccountAddress, token, currentChainId } = useBackendSmartAccount();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const queryKey = QUERY_KEYS.wallet.portfolio(smartAccountAddress || '0x0', currentChainId);

    const { data: portfolio = { assets: [], totalValueUsd: 0 }, isLoading, refetch } = useQuery({
        queryKey,
        queryFn: async () => {
            if (!smartAccountAddress || !token) return { assets: [], totalValueUsd: 0 };
            const response = await apiClient.getPortfolio(token, smartAccountAddress, currentChainId);
            if (response.success && response.data) {
                return response.data;
            }
            throw new Error(response.error?.message || 'Failed to fetch portfolio');
        },
        enabled: !!smartAccountAddress && !!token,
        staleTime: QUERY_TIMES.STANDARD_STALE,
    });

    const assets = portfolio.assets;
    const totalValueUsd = portfolio.totalValueUsd;

    const refreshMutation = useMutation({
        mutationKey: MUTATION_KEYS.portfolio.refresh(smartAccountAddress || '0x0'),
        mutationFn: async () => {
            if (!smartAccountAddress || !token) throw new Error('Unauthenticated');
            const response = await apiClient.refreshPortfolio(token, smartAccountAddress, currentChainId);
            if (response.success && response.data) {
                return response.data;
            }
            throw new Error(response.error?.message || 'Failed to refresh portfolio');
        },
        onSuccess: (newPortfolio) => {
            queryClient.setQueryData(queryKey, newPortfolio);
            toast({
                title: 'Portfolio Refreshed',
                description: 'Your assets have been updated successfully',
                variant: 'success'
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Refresh Failed',
                description: error.message || 'Could not refresh portfolio',
                variant: 'error'
            });
        }
    });

    const nativeAsset = assets.find(a => a.type === 'native');
    const erc20Assets = assets.filter(a => a.type === 'erc20');
    const nftAssets = assets.filter(a => a.type === 'erc721' || a.type === 'erc1155');

    return {
        assets,
        totalValueUsd,
        nativeAsset,
        erc20Assets,
        nftAssets,
        isLoading,
        isRefreshing: refreshMutation.isPending,
        fetchPortfolio: refetch,
        refreshPortfolio: () => refreshMutation.mutate()
    };
}
