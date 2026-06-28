import { useCallback, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Address } from 'viem';
import { apiClient, GasEstimate } from '@/services/apiClient';
import { useToast } from '@/shared/hooks/useToast';
import { useBackendSmartAccount } from '@/entities/wallet/hooks/useBackendSmartAccount';
import { QUERY_KEYS, QUERY_TIMES, MUTATION_KEYS } from '@/shared/lib/reactQuery';
import { toTransaction } from '../model/adapter';

export interface TransactionHistoryItem {
    id?: string;
    hash?: string;
    userOpHash?: string;
    to: Address;
    value: string;
    data?: string;
    status: 'pending' | 'success' | 'failed' | 'queued' | 'processing' | 'submitted' | 'retrying' | 'cancelled';
    timestamp: number;
    receipt?: any;
    failureReason?: string;
    gasUsed?: string;
    bundlerID?: string;
    paymasterID?: string;
    walletID?: string;
    retryCount?: number;
    queuedAt?: string;
    startedAt?: string;
    submittedAt?: string;
    confirmedAt?: string;
    completedAt?: string;
    executionDuration?: number;
    queueDuration?: number;
    blockchainDuration?: number;
    calls?: { to: string; value: string; data: string }[];
    chainId?: number;
}

const isIncompleteStatus = (status: string): boolean => {
    return ['queued', 'processing', 'submitted', 'retrying', 'pending'].includes(status);
};

export function useTransactionHistoryBackend(filters: {
    chainId?: number;
    status?: string;
    search?: string;
    to?: string;
    paymasterID?: string;
    bundlerID?: string;
    page?: number;
    limit?: number;
} = {}) {
    const { token, currentChainId, smartAccountAddress } = useBackendSmartAccount();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null);

    const queryKey = useMemo(() => [
        ...QUERY_KEYS.transactions.history(smartAccountAddress || '0x0', currentChainId),
        filters
    ], [smartAccountAddress, currentChainId, filters]);

    // 1. Transaction History Query (automatic polling when hasPendingTransactions is true)
    const { data, isLoading, error: queryError, refetch } = useQuery({
        queryKey,
        queryFn: async () => {
            if (!token) return { transactions: [], pagination: { totalCount: 0, page: 1, limit: 10, totalPages: 0 } };
            
            const reqFilters = {
                chainId: filters.chainId || currentChainId,
                ...filters
            };
            
            const response = await apiClient.getTransactionHistory(token, reqFilters);
            if (response.success && response.data) {
                const mapped = response.data.transactions.map(toTransaction) as TransactionHistoryItem[];
                
                return {
                    transactions: mapped,
                    pagination: response.data.pagination
                };
            }
            throw new Error(response.error?.message || 'Failed to fetch transaction history');
        },
        enabled: !!token,
        staleTime: QUERY_TIMES.VOLATILE_STALE,
        refetchInterval: (query) => {
            const dataState = query.state.data as { transactions: TransactionHistoryItem[] } | undefined;
            const hasPending = dataState?.transactions?.some(tx => isIncompleteStatus(tx.status));
            return hasPending ? 5000 : false;
        }
    });

    const transactions = data?.transactions || [];
    const pagination = data?.pagination || { totalCount: 0, page: 1, limit: 10, totalPages: 0 };

    // 2. Gas Estimation Mutation
    const estimateMutation = useMutation({
        mutationKey: MUTATION_KEYS.transaction.estimateGas(smartAccountAddress || '0x0'),
        mutationFn: async (params: {
            to: Address;
            data?: string;
            value?: bigint;
            providers?: { bundlerID: string; paymasterID: string; walletID: string; chainId: number };
        }) => {
            if (!token) throw new Error('Unauthenticated');
            const activeChainId = params.providers?.chainId || currentChainId;
            const bundlerID = params.providers?.bundlerID || 'ALCHEMY';
            const paymasterID = params.providers?.paymasterID || 'ALCHEMY';
            const walletID = params.providers?.walletID || '';

            const response = await apiClient.estimateGas(
                token,
                activeChainId,
                bundlerID,
                paymasterID,
                walletID,
                params.to,
                params.data,
                params.value
            );

            if (response.success && response.data) {
                return response.data;
            }
            throw new Error(response.error?.message || 'Gas estimation failed');
        },
        onSuccess: (data) => {
            setGasEstimate(data);
        },
        onError: (err: any) => {
            toast({
                title: 'Gas Estimation Failed',
                description: err.message,
                variant: 'error'
            });
        }
    });

    // 3. Send Transaction Mutation
    const sendMutation = useMutation({
        mutationKey: MUTATION_KEYS.transaction.send(smartAccountAddress || '0x0'),
        mutationFn: async (params: {
            to: Address;
            data?: string;
            value?: bigint;
            providers?: { 
                bundlerID: string; 
                paymasterID: string; 
                walletID: string; 
                chainId: number;
                sessionKeyAddress?: string;
                sessionKeySignature?: string;
            };
        }) => {
            if (!token) throw new Error('Unauthenticated');
            const response = await apiClient.sendTransaction(token, params.to, params.data, params.value, params.providers);
            if (response.success && response.data) {
                return response.data.transaction;
            }
            throw new Error(response.error?.message || 'Transaction failed');
        },
        onSuccess: (txData) => {
            const identifier = txData.hash ? `hash: ${txData.hash.slice(0, 10)}...` : `ID: ${txData.id.slice(0, 8)}...`;
            toast({
                title: 'Transaction Sent',
                description: `Transaction status is: ${txData.status} (${identifier})`,
                variant: 'success'
            });
            // Auto invalidate history & portfolio caches to sync balance & lists
            queryClient.invalidateQueries({ queryKey });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wallet.portfolio(smartAccountAddress || '0x0', currentChainId) });
        },
        onError: (err: any) => {
            toast({
                title: 'Transaction Failed',
                description: err.message,
                variant: 'error'
            });
        }
    });

    // Action wrappers (for backward compatibility)
    const estimateGas = useCallback(async (
        to: Address,
        data?: string,
        value?: bigint,
        providers?: { bundlerID: string; paymasterID: string; walletID: string; chainId: number }
    ) => {
        return estimateMutation.mutateAsync({ to, data, value, providers });
    }, [estimateMutation]);

    const sendTransaction = useCallback(async (
        _authToken: string,
        to: Address,
        data?: string,
        value?: bigint,
        providers?: { 
            bundlerID: string; 
            paymasterID: string; 
            walletID: string; 
            chainId: number;
            sessionKeyAddress?: string;
            sessionKeySignature?: string;
        }
    ) => {
        return sendMutation.mutateAsync({ to, data, value, providers });
    }, [sendMutation]);

    const checkTransactionStatus = useCallback(async (idOrHash: string) => {
        if (!token) return null;
        const response = await apiClient.getTransactionByHash(token, idOrHash);
        if (response.success && response.data) {
            queryClient.invalidateQueries({ queryKey });
            return response.data.transaction;
        }
        return null;
    }, [token, queryClient, queryKey]);

    const fetchTransactionHistory = useCallback(async (
        _authToken?: string,
        params?: any
    ) => {
        if (params) {
            const res = await apiClient.getTransactionHistory(token || '', params);
            if (res.success && res.data) {
                const mapped = res.data.transactions.map(toTransaction) as TransactionHistoryItem[];
                queryClient.setQueryData(queryKey, mapped);
                return mapped;
            }
        }
        await refetch();
        return queryClient.getQueryData(queryKey) as TransactionHistoryItem[];
    }, [token, queryClient, queryKey, refetch]);

    const getTransaction = useCallback((idOrHash: string) => {
        return transactions.find(tx => tx.id === idOrHash || tx.hash === idOrHash);
    }, [transactions]);

    const getTransactionsByStatus = useCallback((status: any) => {
        return transactions.filter(tx => tx.status === status);
    }, [transactions]);

    return {
        transactions,
        pagination,
        isLoading,
        isEstimating: estimateMutation.isPending,
        error: queryError instanceof Error ? queryError.message : queryError ? String(queryError) : null,
        gasEstimate,

        estimateGas,
        sendTransaction,
        retryTransaction: useCallback(async (_txIdOrHash?: string) => {
            toast({
                title: 'Feature Not Available',
                description: 'Transaction retry is not implemented yet.',
                variant: 'warning'
            });
            return null;
        }, [toast]),
        checkTransactionStatus,
        refreshPendingTransactions: useCallback(async () => {
            await refetch();
        }, [refetch]),
        fetchTransactionHistory,
        clearHistory: useCallback(() => {
            queryClient.setQueryData(queryKey, []);
        }, [queryClient, queryKey]),

        getTransaction,
        getTransactionsByStatus,

        pendingTransactions: useMemo(() => transactions.filter(tx => isIncompleteStatus(tx.status)), [transactions]),
        successfulTransactions: useMemo(() => transactions.filter(tx => tx.status === 'success'), [transactions]),
        failedTransactions: useMemo(() => transactions.filter(tx => tx.status === 'failed'), [transactions]),
        totalTransactions: transactions.length,
        hasFailedTransactions: useMemo(() => transactions.some(tx => tx.status === 'failed'), [transactions]),
        hasPendingTransactions: useMemo(() => transactions.some(tx => isIncompleteStatus(tx.status)), [transactions]),
    };
}
