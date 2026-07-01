/* eslint-disable react-refresh/only-export-components */
// src/entities/capability/model/CapabilityContext.tsx
import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { FrontendCapabilities } from './adapter';
import { QUERY_KEYS, QUERY_TIMES } from '@/shared/lib/reactQuery';

export type FeatureType = 'sessionKeys' | 'batching' | 'deployment' | 'gasSponsorship';

interface CapabilityContextType {
    capabilities: FrontendCapabilities | null;
    isLoading: boolean;
    error: string | null;
    hasCapability: (feature: FeatureType) => boolean;
    isChainSupported: (chainId: number) => boolean;
    isPaymasterSupported: (paymasterId: string) => boolean;
    isBundlerSupported: (bundlerId: string) => boolean;
    refetch: () => void;
}

const CapabilityContext = createContext<CapabilityContextType | undefined>(undefined);

export const CapabilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { data: rawCapabilities, isLoading, error, refetch } = useQuery({
        queryKey: QUERY_KEYS.infrastructure.capabilities,
        queryFn: async () => {
            const response = await apiClient.getCapabilities();
            if (response.success && response.data) {
                return response.data;
            }
            throw new Error(response.error?.message || 'Failed to fetch capabilities');
        },
        staleTime: QUERY_TIMES.STATIC_STALE,
    });

    const capabilities = rawCapabilities || null;

    const hasCapability = useCallback((feature: FeatureType): boolean => {
        if (!capabilities) return false;
        switch (feature) {
            case 'sessionKeys':
                return capabilities.sessionKeySupport;
            case 'batching':
                return capabilities.batchingSupport;
            case 'deployment':
                return capabilities.deploymentSupport;
            case 'gasSponsorship':
                return capabilities.gasSponsorshipSupport;
            default:
                return false;
        }
    }, [capabilities]);

    const isChainSupported = useCallback((chainId: number): boolean => {
        if (!capabilities) return false;
        return capabilities.supportedChains.some(c => c.id === chainId);
    }, [capabilities]);

    const isPaymasterSupported = useCallback((paymasterId: string): boolean => {
        if (!capabilities) return false;
        return capabilities.supportedPaymasters.some(
            p => p.toUpperCase() === paymasterId.toUpperCase()
        );
    }, [capabilities]);

    const isBundlerSupported = useCallback((bundlerId: string): boolean => {
        if (!capabilities) return false;
        return capabilities.supportedBundlers.some(
            b => b.toUpperCase() === bundlerId.toUpperCase()
        );
    }, [capabilities]);

    const value = useMemo(() => ({
        capabilities,
        isLoading,
        error: error instanceof Error ? error.message : error ? String(error) : null,
        hasCapability,
        isChainSupported,
        isPaymasterSupported,
        isBundlerSupported,
        refetch
    }), [capabilities, isLoading, error, hasCapability, isChainSupported, isPaymasterSupported, isBundlerSupported, refetch]);

    return (
        <CapabilityContext.Provider value={value}>
            {children}
        </CapabilityContext.Provider>
    );
};

export const useCapabilityContext = () => {
    const context = useContext(CapabilityContext);
    if (!context) {
        throw new Error('useCapabilityContext must be used within a CapabilityProvider');
    }
    return context;
};
