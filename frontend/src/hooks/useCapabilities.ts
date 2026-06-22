import { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';

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
    const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCapabilities = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await apiClient.getCapabilities();
            if (response.success && response.data) {
                setCapabilities(response.data);
            } else {
                throw new Error(response.error?.message || 'Failed to fetch capabilities');
            }
        } catch (err) {
            console.error('Failed to fetch capabilities:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch capabilities');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCapabilities();
    }, []);

    return {
        capabilities,
        isLoading,
        error,
        refetch: fetchCapabilities
    };
}
