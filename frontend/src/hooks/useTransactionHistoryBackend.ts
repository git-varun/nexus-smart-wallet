import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Address} from 'viem';
import {apiClient, GasEstimate, TransactionHistory, TransactionResult} from '../services/apiClient';
import {useToast} from './useToast';
import {useBackendSmartAccount} from './useBackendSmartAccount';

interface TransactionHistoryItem {
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
}

const isIncompleteStatus = (status: string): boolean => {
    return ['queued', 'processing', 'submitted', 'retrying', 'pending'].includes(status);
};

export function useTransactionHistoryBackend() {
    const [transactions, setTransactions] = useState<TransactionHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isEstimating, setIsEstimating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null);
    const {toast} = useToast();
    const {token, currentChainId} = useBackendSmartAccount();
    const transactionsRef = useRef<TransactionHistoryItem[]>([]);

    // Keep ref in sync with state
    useEffect(() => {
        transactionsRef.current = transactions;
    }, [transactions]);

    // Estimate gas for a transaction
    const estimateGas = useCallback(async (
        to: Address,
        data?: string,
        value?: bigint,
        providers?: { bundlerID: string; paymasterID: string; walletID: string; chainId: number }
    ): Promise<GasEstimate | null> => {
        try {
            setIsEstimating(true);
            setError(null);

            if (!token) {
                throw new Error('Authentication token not available');
            }

            const activeChainId = providers?.chainId || currentChainId;
            const bundlerID = providers?.bundlerID || 'ALCHEMY';
            const paymasterID = providers?.paymasterID || 'ALCHEMY';
            const walletID = providers?.walletID || ''; // Should be the smart account address/ID

            const response = await apiClient.estimateGas(
                token, 
                activeChainId, 
                bundlerID, 
                paymasterID, 
                walletID, 
                to, 
                data, 
                value
            );

            if (response.success && response.data) {
                setGasEstimate(response.data);
                return response.data;
            } else {
                throw new Error(response.error?.message || 'Gas estimation failed');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Gas estimation failed';
            setError(errorMessage);

            toast({
                title: 'Gas Estimation Failed',
                description: errorMessage,
                variant: 'error'
            });

            return null;
        } finally {
            setIsEstimating(false);
        }
    }, [token, currentChainId, toast]);

    // Send a new transaction
    const sendTransaction = useCallback(async (
        token: string,
        to: Address,
        data?: string,
        value?: bigint,
        providers?: { bundlerID: string; paymasterID: string; walletID: string; chainId: number }
    ): Promise<TransactionResult> => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await apiClient.sendTransaction(token, to, data, value, providers);

            if (response.success && response.data) {
                const txData = response.data.transaction;
                // Add transaction to local history
                const newTransaction: TransactionHistoryItem = {
                    id: txData.id,
                    hash: txData.hash,
                    userOpHash: txData.userOpHash,
                    to,
                    value: value?.toString() || '0',
                    data,
                    status: txData.status === 'confirmed' ? 'success' : txData.status as any,
                    timestamp: Date.now(),
                    failureReason: txData.failureReason
                };

                setTransactions(prev => [newTransaction, ...prev]);

                const identifier = txData.hash ? `hash: ${txData.hash.slice(0, 10)}...` : `ID: ${txData.id.slice(0, 8)}...`;
                toast({
                    title: 'Transaction Sent',
                    description: `Transaction status is: ${txData.status} (${identifier})`,
                    variant: 'success'
                });

                return txData;
            } else {
                throw new Error(response.error?.message || 'Transaction failed');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
            setError(errorMessage);

            toast({
                title: 'Transaction Failed',
                description: errorMessage,
                variant: 'error'
            });

            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    // Check transaction status
    const checkTransactionStatus = useCallback(async (idOrHash: string) => {
        try {
            if (!token) return null;
            const response = await apiClient.getTransactionByHash(token, idOrHash);

            if (response.success && response.data) {
                const updatedTx = response.data.transaction;
                // Update transaction status in local history
                setTransactions(prev =>
                    prev.map(tx =>
                        (tx.id === idOrHash || tx.hash === idOrHash)
                            ? {
                                ...tx,
                                hash: updatedTx.hash || tx.hash,
                                userOpHash: updatedTx.userOpHash || tx.userOpHash,
                                status: updatedTx.status === 'confirmed' ? 'success' : updatedTx.status as any,
                                receipt: updatedTx.gasUsed ? { gasUsed: updatedTx.gasUsed } : undefined,
                                failureReason: updatedTx.failureReason
                            }
                            : tx
                    )
                );

                return updatedTx;
            } else {
                console.warn('Failed to check transaction status:', response.error?.message);
                return null;
            }
        } catch (err) {
            console.error('Error checking transaction status:', err);
            return null;
        }
    }, [token]);

    // Refresh all pending transactions
    const refreshPendingTransactions = useCallback(async () => {
        const pendingTxs = transactionsRef.current.filter(tx => isIncompleteStatus(tx.status));

        for (const tx of pendingTxs) {
            const idOrHash = tx.id || tx.hash;
            if (idOrHash) {
                await checkTransactionStatus(idOrHash);
            }
        }
    }, [checkTransactionStatus]);

    // Retry a failed transaction (placeholder - backend doesn't support retry yet)
    const retryTransaction = useCallback(async (_transactionId: string): Promise<TransactionResult | null> => {
        toast({
            title: 'Feature Not Available',
            description: 'Transaction retry is not implemented yet.',
            variant: 'warning'
        });
        return null;
    }, [toast]);

    const fetchTransactionHistory = useCallback(async (
        authToken?: string,
        paramsOrChainId?: number | {
            chainId?: number;
            limit?: number;
            page?: number;
            status?: string;
            search?: string;
            to?: string;
            paymasterID?: string;
            bundlerID?: string;
            sortBy?: string;
            sortOrder?: 'asc' | 'desc';
        },
        limitArg?: number
    ) => {
        try {
            setIsLoading(true);
            setError(null);

            const activeToken = authToken || token;
            if (!activeToken) {
                throw new Error('Authentication token not available');
            }

            let fetchParams: any = {};
            if (typeof paramsOrChainId === 'object' && paramsOrChainId !== null) {
                fetchParams = paramsOrChainId;
            } else {
                if (paramsOrChainId !== undefined) fetchParams.chainId = paramsOrChainId;
                if (limitArg !== undefined) fetchParams.limit = limitArg;
            }

            const response = await apiClient.getTransactionHistory(activeToken, fetchParams);

            if (response.success && response.data) {
                const backendTransactions: TransactionHistoryItem[] = response.data.transactions.map((tx: TransactionHistory) => ({
                    id: tx.id,
                    hash: tx.hash,
                    userOpHash: tx.userOpHash,
                    to: tx.to,
                    value: tx.value,
                    data: tx.data,
                    status: tx.status === 'confirmed' ? 'success' : tx.status as any,
                    timestamp: new Date(tx.createdAt).getTime(),
                    failureReason: tx.failureReason,
                    gasUsed: tx.gasUsed
                }));

                setTransactions(backendTransactions);
                return backendTransactions;
            } else {
                throw new Error(response.error?.message || 'Failed to fetch transaction history');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transaction history';
            setError(errorMessage);
            console.error('Error fetching transaction history:', err);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Clear transaction history
    const clearHistory = useCallback(() => {
        setTransactions([]);
        setError(null);
        setGasEstimate(null);
    }, []);

    // Get transaction by hash
    const getTransaction = useCallback((idOrHash: string) => {
        return transactions.find(tx => tx.id === idOrHash || tx.hash === idOrHash);
    }, [transactions]);

    // Get transactions by status
    const getTransactionsByStatus = useCallback((status: 'pending' | 'success' | 'failed' | 'queued' | 'processing' | 'submitted' | 'retrying') => {
        return transactions.filter(tx => tx.status === status);
    }, [transactions]);

    // Memoize pending transactions count to avoid unnecessary effect runs
    const pendingTransactionsCount = useMemo(() => {
        return transactions.filter(tx => isIncompleteStatus(tx.status)).length;
    }, [transactions]);

    // Auto-refresh pending transactions periodically
    useEffect(() => {
        if (pendingTransactionsCount > 0) {
            const interval = setInterval(() => {
                refreshPendingTransactions();
            }, 5000); // Check every 5 seconds for faster updates in development/prod async execution

            return () => clearInterval(interval);
        }
    }, [pendingTransactionsCount, refreshPendingTransactions]);

    return {
        // State
        transactions,
        isLoading,
        isEstimating,
        error,
        gasEstimate,

        // Actions
        estimateGas,
        sendTransaction,
        retryTransaction,
        checkTransactionStatus,
        refreshPendingTransactions,
        fetchTransactionHistory,
        clearHistory,

        // Getters
        getTransaction,
        getTransactionsByStatus,

        // Computed values (memoized)
        pendingTransactions: useMemo(() => transactions.filter(tx => isIncompleteStatus(tx.status)), [transactions]),
        successfulTransactions: useMemo(() => transactions.filter(tx => tx.status === 'success'), [transactions]),
        failedTransactions: useMemo(() => transactions.filter(tx => tx.status === 'failed'), [transactions]),
        totalTransactions: transactions.length,
        hasFailedTransactions: useMemo(() => transactions.some(tx => tx.status === 'failed'), [transactions]),
        hasPendingTransactions: useMemo(() => transactions.some(tx => isIncompleteStatus(tx.status)), [transactions]),
    };
}
