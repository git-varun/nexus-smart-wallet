import {useCallback, useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Address} from 'viem';
import {apiClient} from '@/services/apiClient';
import {RootState} from '@/app/store/store';
import {
    clearAuthData,
    setAuthData,
    setCurrentChainId,
    setIsLoading,
    setCreationError,
    setSmartAccountInfo,
    setUserAccounts,
} from '@/app/store/smartAccountSlice';

// Token management
const TOKEN_KEY = 'nexus_auth_token';

const REFRESH_TOKEN_KEY = 'nexus_refresh_token';

const createAccountRequests = new Map<string, Promise<unknown>>();

const getStoredToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
};

const setStoredToken = (token: string, refreshToken?: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
    if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
};

const removeStoredToken = (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export function useBackendSmartAccount() {
    const dispatch = useDispatch();
    const {
        isAuthenticated,
        user,
        token,
        smartAccountInfo: accountInfo,
        userAccounts,
        currentChainId,
        isLoading: loading,
    } = useSelector((state: RootState) => state.smartAccount);

    const error = useSelector((state: RootState) => state.smartAccount.creationError);

    const handleLogout = useCallback(async () => {
        // Clear stored token
        removeStoredToken();
        // Clear Redux state
        dispatch(clearAuthData());
    }, [dispatch]);

    // Hook Response Interceptor for global logout triggers
    useEffect(() => {
        const handleUnauthorized = () => {
            handleLogout();
        };
        window.addEventListener('nexus-auth-unauthorized', handleUnauthorized);
        return () => window.removeEventListener('nexus-auth-unauthorized', handleUnauthorized);
    }, [handleLogout]);

    // Synchronize Redux token when API client silent refresh completes
    useEffect(() => {
        const handleTokenRefreshed = (e: Event) => {
            const customEvent = e as CustomEvent<{ token: string }>;
            if (user && customEvent.detail?.token) {
                dispatch(setAuthData({ user, token: customEvent.detail.token }));
            }
        };
        window.addEventListener('nexus-token-refreshed', handleTokenRefreshed);
        return () => window.removeEventListener('nexus-token-refreshed', handleTokenRefreshed);
    }, [user, dispatch]);

    const loadAccountInfo = useCallback(async (authToken: string, chainId?: number) => {
        try {
            const targetChainId = chainId || currentChainId;
            const accountsResponse = await apiClient.getUserAccounts(authToken, targetChainId);
            if (accountsResponse.success && accountsResponse.data?.accounts) {
                const accounts = accountsResponse.data.accounts;
                dispatch(setUserAccounts(accounts));
                dispatch(setSmartAccountInfo(accounts[0] ?? null));
            } else {
                throw new Error(accountsResponse.error?.message || 'Failed to load accounts');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load account info';
            dispatch(setCreationError(message));
            console.error('Failed to load account info:', err);
            throw err;
        }
    }, [currentChainId, dispatch]);

    const checkAuthStatus = useCallback(async () => {
        try {
            dispatch(setIsLoading(true));

            // First check if we have a stored token
            const storedToken = getStoredToken();
            if (!storedToken) {
                await handleLogout();
                return;
            }

            // Verify token with backend
            const response = await apiClient.getAuthStatus(storedToken);

            if (response.success && response.data) {
                const {authenticated, user: userData} = response.data;

                if (authenticated && userData) {
                    dispatch(setAuthData({user: userData, token: storedToken}));
                    await loadAccountInfo(storedToken);
                } else {
                    await handleLogout();
                }
            } else {
                await handleLogout();
            }
        } catch (err) {
            console.error('Failed to check auth status:', err);
            await handleLogout();
        } finally {
            dispatch(setIsLoading(false));
        }
    }, [dispatch, handleLogout, loadAccountInfo]);

    // Check authentication status on mount
    useEffect(() => {
        if (!isAuthenticated) {
            checkAuthStatus();
        }
    }, [isAuthenticated, checkAuthStatus]);

    // loadAccountInfo handles both userAccounts and smartAccountInfo — use it directly.
    const loadUserAccounts = loadAccountInfo;

    const loginWithCredentials = useCallback(async (userData: { user: any; token: string; refreshToken?: string }) => {
        try {
            dispatch(setIsLoading(true));

            const {user: userInfo, token: authToken, refreshToken} = userData;

            // Store token
            setStoredToken(authToken, refreshToken);

            // Update Redux state
            dispatch(setAuthData({user: userInfo, token: authToken}));

            // Load account info
            await loadAccountInfo(authToken);

            console.log('✅ Authentication successful:', {user: userInfo});
            return {user: userInfo, token: authToken, refreshToken};
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
            throw new Error(errorMessage);
        } finally {
            dispatch(setIsLoading(false));
        }
    }, [dispatch, loadAccountInfo]);

    const connect = useCallback(async (email: string, password?: string) => {
        try {
            dispatch(setIsLoading(true));

            if (!password) {
                throw new Error('Password is required');
            }
            const response = await apiClient.login(email, password);

            if (response.success && response.data) {
                const {user: userData, token: authToken, refreshToken} = response.data;

                setStoredToken(authToken, refreshToken);
                dispatch(setAuthData({user: userData, token: authToken}));
                await loadAccountInfo(authToken);

                return {user: userData, token: authToken};
            } else {
                throw new Error(response.error?.message || 'Authentication failed');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
            throw new Error(errorMessage);
        } finally {
            dispatch(setIsLoading(false));
        }
    }, [dispatch, loadAccountInfo]);

    const register = useCallback(async (email: string, password?: string) => {
        try {
            dispatch(setIsLoading(true));

            if (!password) {
                throw new Error('Password is required');
            }
            const response = await apiClient.register(email, password);

            if (response.success) {
                // Auto-login after successful registration
                const loginResponse = await apiClient.login(email, password);
                if (loginResponse.success && loginResponse.data) {
                    const {user: userData, token: authToken, refreshToken} = loginResponse.data;

                    setStoredToken(authToken, refreshToken);
                    dispatch(setAuthData({user: userData, token: authToken}));
                    await loadAccountInfo(authToken);

                    return {user: userData, token: authToken};
                } else {
                    throw new Error(loginResponse.error?.message || 'Authentication failed after registration');
                }
            } else {
                throw new Error(response.error?.message || 'Registration failed');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Registration failed';
            throw new Error(errorMessage);
        } finally {
            dispatch(setIsLoading(false));
        }
    }, [dispatch, loadAccountInfo]);

    const disconnect = useCallback(async () => {
        try {
            dispatch(setIsLoading(true));

            const currentToken = token || getStoredToken();
            if (currentToken) {
                try {
                    await apiClient.logout(currentToken);
                } catch (err) {
                    console.warn('Backend logout failed:', err);
                }
            }

            await handleLogout();
        } catch (err) {
            console.error('Failed to disconnect:', err);
        } finally {
            dispatch(setIsLoading(false));
        }
    }, [token, handleLogout, dispatch]);

    const sendTransaction = useCallback(async (to: Address, data?: string, value?: bigint) => {
        try {
            if (!isAuthenticated || !token) {
                throw new Error('Not authenticated');
            }

            const providers = {
                bundlerID: 'ALCHEMY',
                paymasterID: 'ALCHEMY',
                walletID: accountInfo?.walletID || '',
                chainId: currentChainId
            };

            const response = await apiClient.sendTransaction(token, to, data, value, providers);

            if (response.success && response.data) {
                return response.data.transaction;
            } else {
                throw new Error(response.error?.message || 'Transaction failed');
            }
        } catch (err) {
            console.error('Transaction failed:', err);
            throw err;
        }
    }, [isAuthenticated, token, accountInfo, currentChainId]);

    const createSmartAccount = useCallback(async (
        chainId?: number,
        walletID: string = 'ALCHEMY',
        accountType: string = 'default'
    ) => {
        if (!isAuthenticated || !token) {
            throw new Error('Not authenticated');
        }

        const targetChainId = chainId || currentChainId;
        const requestKey = `${token}:${targetChainId}:${walletID}:${accountType}`;
        const activeRequest = createAccountRequests.get(requestKey);
        if (activeRequest) {
            return activeRequest;
        }

        const request = (async () => {
            try {
                dispatch(setIsLoading(true));
                const response = await apiClient.createSmartAccount(
                    token,
                    targetChainId,
                    walletID,
                    accountType
                );

                if (response.success && response.data) {
                    await loadAccountInfo(token, targetChainId);
                    return response.data;
                } else {
                    throw new Error(response.error?.message || 'Failed to create smart account');
                }
            } catch (err) {
                console.error('Failed to create smart account:', err);
                throw err;
            } finally {
                createAccountRequests.delete(requestKey);
                dispatch(setIsLoading(false));
            }
        })();

        createAccountRequests.set(requestKey, request);
        return request;
    }, [isAuthenticated, token, currentChainId, loadAccountInfo, dispatch]);

    const deploySmartAccount = useCallback(async (
        paymasterID: string = 'ALCHEMY',
        bundlerID: string = 'ALCHEMY'
    ) => {
        try {
            if (!isAuthenticated || !token) {
                throw new Error('Not authenticated');
            }
            if (!accountInfo?.walletID) {
                throw new Error('No smart account available to deploy');
            }

            dispatch(setIsLoading(true));
            const response = await apiClient.deploySmartAccount(
                token,
                currentChainId,
                accountInfo.walletID,
                paymasterID,
                bundlerID
            );

            if (response.success && response.data) {
                await loadAccountInfo(token, currentChainId);
                return response.data;
            }

            throw new Error(response.error?.message || 'Failed to deploy smart account');
        } catch (err) {
            console.error('Failed to deploy smart account:', err);
            throw err;
        } finally {
            dispatch(setIsLoading(false));
        }
    }, [isAuthenticated, token, accountInfo, currentChainId, loadAccountInfo, dispatch]);

    const executeTransaction = useCallback(async (params: { target: string; value?: string; data?: string }) => {
        try {
            if (!isAuthenticated || !token) {
                throw new Error('Not authenticated');
            }

            dispatch(setIsLoading(true));
            const providers = {
                bundlerID: 'ALCHEMY',
                paymasterID: 'ALCHEMY',
                walletID: accountInfo?.walletID || '',
                chainId: currentChainId
            };

            const response = await apiClient.sendTransaction(
                token,
                params.target as Address,
                params.data,
                params.value ? BigInt(params.value) : undefined,
                providers
            );

            if (response.success && response.data) {
                return {
                    hash: response.data.transaction.hash,
                    userOpHash: response.data.transaction.userOpHash,
                    success: true
                };
            } else {
                throw new Error(response.error?.message || 'Transaction failed');
            }
        } catch (err) {
            console.error('Transaction execution failed:', err);
            throw err;
        } finally {
            dispatch(setIsLoading(false));
        }
    }, [isAuthenticated, token, accountInfo, currentChainId, dispatch]);

    const executeBatchTransaction = useCallback(async (params: { transactions: { target: string; value?: string; data?: string }[] }) => {
        try {
            if (!isAuthenticated || !token) {
                throw new Error('Not authenticated');
            }
            if (!accountInfo?.walletID) {
                throw new Error('No smart account available');
            }

            dispatch(setIsLoading(true));
            
            const payload = {
                calls: params.transactions.map(t => ({
                    to: t.target,
                    value: t.value || '0',
                    data: t.data || '0x'
                })),
                chainId: currentChainId,
                walletID: accountInfo.walletID,
                paymasterID: 'ALCHEMY',
                bundlerID: 'ALCHEMY'
            };

            const response = await apiClient.sendTransactionBatch(token, payload);

            if (response.success && response.data) {
                return {
                    hash: response.data.transaction.hash,
                    userOpHash: response.data.transaction.userOpHash,
                    success: true
                };
            } else {
                throw new Error(response.error?.message || 'Batch transaction failed');
            }
        } catch (err) {
            console.error('Batch transaction execution failed:', err);
            throw err;
        } finally {
            dispatch(setIsLoading(false));
        }
    }, [isAuthenticated, token, accountInfo, currentChainId, dispatch]);

    const switchChain = useCallback(async (newChainId: number) => {
        if (newChainId === currentChainId) {
            return;
        }

        dispatch(setCurrentChainId(newChainId));

        // If authenticated, reload account data for the new chain
        if (isAuthenticated && token) {
            try {
                await loadAccountInfo(token, newChainId);
            } catch (err) {
                console.error('Failed to load account info for new chain:', err);
            }
        }
    }, [currentChainId, isAuthenticated, token, loadAccountInfo, dispatch]);

    return {
        // State
        isAuthenticated,
        user,
        accountInfo,
        userAccounts,
        loading,
        error,
        token,
        currentChainId,

        // Actions
        connect,
        register,
        loginWithCredentials,
        disconnect,
        sendTransaction,
        checkAuthStatus,
        loadUserAccounts,
        switchChain,
        executeTransaction,
        executeBatchTransaction,

        // Computed values
        smartAccountAddress: accountInfo?.address || null,
        balance: accountInfo?.balance || '0',

        // Compatibility properties for existing components
        isConnected: isAuthenticated,
        isChainSupported: true,
        chainId: currentChainId,
        isCreatingAccount: loading,
        creationProgress: {
            isProcessing: loading,
            progress: loading ? 50 : 0,
            completedSteps: 0,
            totalSteps: 1,
            currentStep: loading ? { title: 'Processing', description: 'Communicating with backend...' } : null,
            hasError: !!error,
            error: error
        },
        createSmartAccount,
        deploySmartAccount,
        tokenBalances: [],
        nonce: accountInfo?.nonce || 0,
        isDeployed: accountInfo?.isDeployed || false,
        paymasterDeposit: '0',
        isLoading: loading,
        isExecuting: loading, // Add isExecuting for compatibility
        refreshData: checkAuthStatus,
        getSystemHealth: () => Promise.resolve({overall: 'healthy' as const}),
        alchemyService: null,
        smartAccount: accountInfo, // Partial compatibility
        smartAccountClient: null,
        isSmartAccountReady: isAuthenticated && !!accountInfo?.address && !!accountInfo?.isDeployed
    };
}
