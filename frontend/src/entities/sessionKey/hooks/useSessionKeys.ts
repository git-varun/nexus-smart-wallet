import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackendSmartAccount } from '@/entities/wallet/hooks/useBackendSmartAccount';
import { useToast } from '@/shared/hooks/useToast';
import { CreateSessionKeyParams, SessionKey } from '@/types/session';
import { apiClient } from '@/services/apiClient';
import { QUERY_KEYS, QUERY_TIMES, MUTATION_KEYS } from '@/shared/lib/reactQuery';
import { useAccount, useSignMessage } from 'wagmi';
import { parseEther } from 'viem';


export const useSessionKeys = () => {
    const { smartAccountAddress, token, currentChainId } = useBackendSmartAccount();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { signMessageAsync } = useSignMessage();
    const { isConnected: isEoaConnected } = useAccount();

    const queryKey = QUERY_KEYS.security.sessionKeys(smartAccountAddress || '0x0', currentChainId);

    const { data: sessionKeys = [], isLoading, refetch } = useQuery({
        queryKey,
        queryFn: async () => {
            if (!smartAccountAddress || !token) return [];
            const response = await apiClient.getSessionKeys(token, currentChainId, smartAccountAddress);
            if (response.success && response.data) {
                return response.data;
            }
            throw new Error(response.error?.message || 'Failed to fetch session keys');
        },
        enabled: !!smartAccountAddress && !!token,
        staleTime: QUERY_TIMES.STANDARD_STALE,
    });

    const createMutation = useMutation({
        mutationKey: MUTATION_KEYS.security.createKey(smartAccountAddress || '0x0'),
        mutationFn: async (params: CreateSessionKeyParams) => {
            if (!smartAccountAddress || !token) {
                throw new Error('Smart account not connected or not authenticated');
            }

            const expiresAt = params.expiryTime ? new Date(params.expiryTime * 1000).toISOString() : undefined;

            let signature: string | undefined = undefined;
            if (isEoaConnected) {
                const message = `Register session key: ${params.sessionKey.toLowerCase()}\nOwner: ${smartAccountAddress.toLowerCase()}\nChain ID: ${currentChainId}\nExpires At: ${expiresAt || 'Never'}`;
                signature = await signMessageAsync({ message });
            }

            const spendingLimitWei = parseEther(params.spendingLimit).toString();

            const permissions = (params.allowedTargets && params.allowedTargets.length > 0)
                ? params.allowedTargets.map((target: any) => ({
                    target: target as `0x${string}`,
                    allowedFunctions: ['*'],
                    spendingLimit: spendingLimitWei
                }))
                : [
                    {
                        target: smartAccountAddress as `0x${string}`,
                        allowedFunctions: ['*'],
                        spendingLimit: spendingLimitWei
                    }
                ];

            const response = await apiClient.createSessionKey(token, {
                ownerAddress: smartAccountAddress,
                publicKey: params.sessionKey,
                permissions,
                expiresAt,
                chainId: currentChainId,
                signature
            });

            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to create session key');
            }
            return response.data;
        },
        onSuccess: () => {
            toast({
                title: 'Session Key Created',
                description: 'New session key has been created successfully',
                variant: 'success'
            });
            queryClient.invalidateQueries({ queryKey });
        },
        onError: (error: any) => {
            toast({
                title: 'Creation Failed',
                description: error.message || 'Failed to create session key',
                variant: 'error'
            });
        }
    });

    const revokeMutation = useMutation({
        mutationKey: MUTATION_KEYS.security.revokeKey(smartAccountAddress || '0x0'),
        mutationFn: async (sessionKeyAddress: string) => {
            if (!smartAccountAddress || !token) throw new Error('Unauthenticated');
            const response = await apiClient.revokeSessionKey(token, sessionKeyAddress);
            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to revoke session key');
            }
            return sessionKeyAddress;
        },
        onSuccess: (sessionKeyAddress) => {
            queryClient.setQueryData(queryKey, (old: SessionKey[] | undefined) => {
                if (!old) return [];
                return old.filter(sk => sk.key !== sessionKeyAddress);
            });
            toast({
                title: 'Session Key Revoked',
                description: 'Session key has been revoked successfully',
                variant: 'success'
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Revocation Failed',
                description: error.message || 'Failed to revoke session key',
                variant: 'error'
            });
        }
    });

    const validateSessionKey = useCallback(async (sessionKeyId: string): Promise<boolean> => {
        if (!smartAccountAddress || !token) return false;
        const response = await apiClient.validateSessionKey(token, sessionKeyId);
        if (!response.success || !response.data) {
            throw new Error(response.error?.message || 'Failed to validate session key');
        }
        return response.data.isValid;
    }, [smartAccountAddress, token]);

    return {
        sessionKeys,
        isLoading,
        isCreating: createMutation.isPending,
        isRevoking: revokeMutation.isPending,
        fetchSessionKeys: refetch,
        createSessionKey: createMutation.mutateAsync,
        revokeSessionKey: revokeMutation.mutateAsync,
        validateSessionKey,
        activeSessionKeys: sessionKeys.filter((key: any) => key.isActive),
        expiredSessionKeys: sessionKeys.filter((key: any) => !key.isActive || key.expiryTime <= Math.floor(Date.now() / 1000)),
        totalSessionKeys: sessionKeys.length
    };
};
