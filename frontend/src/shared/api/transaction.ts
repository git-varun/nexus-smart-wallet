// src/shared/api/transaction.ts
import { apiClient, ApiResponse } from './client';
import { Address } from 'viem';

export interface TransactionResult {
    id: string;
    hash?: string;
    userOpHash?: string;
    status: string;
}

export interface TransactionHistory {
    id: string;
    hash?: string;
    userOpHash?: string;
    to: Address;
    value: string;
    data?: string;
    status: 'pending' | 'queued' | 'processing' | 'submitted' | 'confirmed' | 'failed' | 'retrying' | 'cancelled';
    gasUsed?: string;
    failureReason?: string;
    createdAt: string;
    updatedAt: string;
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

export async function deploySmartAccount(
    chainId: number,
    walletID: string,
    paymasterID: string = 'ALCHEMY',
    bundlerID: string = 'ALCHEMY',
    token?: string
): Promise<ApiResponse<{ transaction: TransactionResult; account?: any }>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<{ transaction: TransactionResult; account?: any }>('/api/transactions/deploy', {
        method: 'POST',
        headers,
        body: JSON.stringify({ chainId, walletID, paymasterID, bundlerID }),
    });
}

export async function sendTransaction(
    to: Address,
    data?: string,
    value?: string,
    providers?: { 
        bundlerID: string; 
        paymasterID: string; 
        walletID: string; 
        chainId: number;
        sessionKeyAddress?: string;
        sessionKeySignature?: string;
    },
    token?: string
): Promise<ApiResponse<{ transaction: TransactionResult }>> {
    const payload: any = {
        to,
        data: data || '0x',
        value: value || '0',
    };

    if (providers) {
        payload.bundlerID = providers.bundlerID;
        payload.paymasterID = providers.paymasterID;
        payload.walletID = providers.walletID;
        payload.chainId = providers.chainId;
        if (providers.sessionKeyAddress) {
            payload.sessionKeyAddress = providers.sessionKeyAddress;
        }
        if (providers.sessionKeySignature) {
            payload.sessionKeySignature = providers.sessionKeySignature;
        }
    }

    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return apiClient.request<{ transaction: TransactionResult }>('/api/transactions/send', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    });
}

export async function sendTransactionBatch(
    payload: {
        calls: { to: string; value?: string; data?: string }[];
        chainId: number;
        walletID: string;
        paymasterID: string;
        bundlerID: string;
        idempotencyKey?: string;
        sessionKeyAddress?: string;
        sessionKeySignature?: string;
    },
    token?: string
): Promise<ApiResponse<any>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<any>('/api/transactions/batch', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    });
}

export async function estimateGas(
    chainId: number,
    bundlerID: string,
    paymasterID: string,
    walletID: string,
    to: Address,
    data?: string,
    value?: string,
    token?: string
): Promise<ApiResponse<{ gasEstimate: string; gasLimit: string; breakdown: any }>> {
    const payload: any = {
        to,
        data: data || '0x',
        value: value || '0',
        chainId,
        bundlerID,
        paymasterID,
        walletID
    };

    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return apiClient.request<{
        gasEstimate: string;
        gasLimit: string;
        breakdown: any
    }>('/api/transactions/estimate_gas', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    });
}

export async function getTransactionByHash(idOrHash: string, token?: string): Promise<ApiResponse<{ transaction: TransactionHistory }>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<{ transaction: TransactionHistory }>(`/api/transactions/${idOrHash}`, { headers });
}

export async function getOperationStatus(userOpHash: string, chainId: number, bundlerId: string, token?: string): Promise<ApiResponse<any>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<any>('/api/transactions/user_op', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ userOpHash, chainId, bundlerId }),
    });
}

export async function getGasPrice(chainId: number): Promise<ApiResponse<{ gasPrice: string }>> {
    return apiClient.request<{ gasPrice: string }>(`/api/transactions/gas_price?chainId=${chainId}`);
}
