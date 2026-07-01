import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { QUERY_TIMES } from '@/shared/lib/reactQuery';

export interface ChainInfo {
    id: number;
    name: string;
}

export interface Capabilities {
    supportedWallets: string[];
    supportedChains: ChainInfo[];
    supportedBundlers: string[];
    supportedPaymasters: string[];
    sessionKeySupport: boolean;
    batchingSupport: boolean;
    deploymentSupport: boolean;
    gasSponsorshipSupport: boolean;
}

export function useCapabilities() {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['infra', 'capabilities'],
        queryFn: async () => {
            const response = await apiClient.getCapabilities();
            if (response.success && response.data) {
                return response.data;
            }
            throw new Error(response.error?.message || 'Failed to fetch capabilities');
        },
        staleTime: QUERY_TIMES.STATIC_STALE,
    });

    return {
        capabilities: data || null,
        isLoading,
        error: error instanceof Error ? error.message : error ? String(error) : null,
        refetch
    };
}
