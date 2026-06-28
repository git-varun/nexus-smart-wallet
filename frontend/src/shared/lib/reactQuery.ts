// src/shared/lib/reactQuery.ts
import { QueryClient, QueryFilters } from '@tanstack/react-query';

/**
 * Standard stale/cache times for smart wallet state sync.
 * Prevents excessive RPC queries while maintaining operational accuracy.
 */
export const QUERY_TIMES = {
    // Highly volatile data (balances, gas pricing, tx status)
    VOLATILE_STALE: 10 * 1000, // 10s
    // Standard portfolio and session key listings
    STANDARD_STALE: 30 * 1000, // 30s
    // Relatively static configs (paymaster, bundler availability, account types)
    STATIC_STALE: 5 * 60 * 1000, // 5m
    
    // Default Cache expiration
    DEFAULT_CACHE: 10 * 60 * 1000, // 10m
};

/**
 * Global Query Keys Registry.
 * Prevents magic strings and guarantees consistent keys across the application.
 */
export const QUERY_KEYS = {
    auth: {
        session: ['auth', 'session'] as const,
        user: (userId: string) => ['auth', 'user', userId] as const,
    },
    wallet: {
        info: (address: string, chainId: number) => ['wallet', 'info', address, chainId] as const,
        portfolio: (address: string, chainId: number) => ['wallet', 'portfolio', address, chainId] as const,
        assets: (address: string, chainId: number) => ['wallet', 'assets', address, chainId] as const,
    },
    transactions: {
        history: (address: string, chainId: number) => ['transactions', 'history', address, chainId] as const,
        status: (userOpHash: string) => ['transactions', 'status', userOpHash] as const,
    },
    security: {
        sessionKeys: (address: string, chainId: number) => ['security', 'sessionKeys', address, chainId] as const,
        guardians: (address: string, chainId: number) => ['security', 'guardians', address, chainId] as const,
    },
    infrastructure: {
        health: ['infra', 'health'] as const,
        gasPrice: (chainId: number) => ['infra', 'gasPrice', chainId] as const,
        capabilities: ['infra', 'capabilities'] as const,
    }
};

/**
 * Global Mutation Keys Registry.
 * Prevents magic strings and guarantees consistent mutation tracking.
 */
export const MUTATION_KEYS = {
    auth: {
        login: ['auth', 'login'] as const,
        register: ['auth', 'register'] as const,
        logout: ['auth', 'logout'] as const,
    },
    wallet: {
        create: ['wallet', 'create'] as const,
        deploy: (address: string) => ['wallet', 'deploy', address] as const,
    },
    portfolio: {
        refresh: (address: string) => ['portfolio', 'refresh', address] as const,
    },
    transaction: {
        send: (address: string) => ['transaction', 'send', address] as const,
        batch: (address: string) => ['transaction', 'batch', address] as const,
        estimateGas: (address: string) => ['transaction', 'estimateGas', address] as const,
    },
    security: {
        createKey: (address: string) => ['security', 'createKey', address] as const,
        revokeKey: (address: string) => ['security', 'revokeKey', address] as const,
    }
};

/**
 * Default retry behavior:
 * Retry standard network requests up to 2 times, except for client-side authorization and not-found errors.
 */
const shouldRetry = (failureCount: number, error: any): boolean => {
    if (failureCount >= 2) return false;
    
    const status = error?.status || error?.response?.status || (error?.error?.status);
    // Do not retry authorization errors or not found
    if (status === 401 || status === 403 || status === 404) {
        return false;
    }
    return true;
};

/**
 * Standard QueryClient configuration factory.
 * Guarantees consistent staleness, caching, and network retries.
 */
export const createStandardQueryClient = (): QueryClient => {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: QUERY_TIMES.STANDARD_STALE,
                gcTime: QUERY_TIMES.DEFAULT_CACHE,
                retry: shouldRetry,
                refetchOnWindowFocus: false, // Prevent aggressive network refetching on click-away
                refetchOnReconnect: 'always',
            },
            mutations: {
                retry: 0, // Fail immediately for transactions/mutations
            }
        }
    });
};

/**
 * Standard invalidation helper after mutation/optimistic updates.
 */
export const invalidateWalletQueries = async (
    queryClient: QueryClient,
    address: string,
    _chainId: number
) => {
    const filters: QueryFilters = {
        predicate: (query) => {
            const key = query.queryKey as string[];
            // Invalidate wallet, transaction and security state for this address
            return (
                (key[0] === 'wallet' || key[0] === 'transactions' || key[0] === 'security') &&
                key.includes(address)
            );
        }
    };
    await queryClient.invalidateQueries(filters);
};
