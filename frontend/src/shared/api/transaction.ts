// src/shared/api/transaction.ts
import { apiClient, ApiResponse } from './client';
import { Address } from 'viem';
import {
    number,
    object,
    objectData,
    optional,
    string,
    TransactionDto,
    transactionDto,
    TransactionStatus,
} from './contracts';

export type TransactionResult = TransactionDto;

export interface TransactionHistory {
    id: string;
    accountId: string;
    hash?: string;
    userOpHash?: string;
    to?: string;
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
    chainId: number;
}

const transactionHistoryDto = (value: unknown, path = 'data.transactions[]'): asserts value is TransactionHistory => {
    const dto = object(value, path);
    string(dto.id, `${path}.id`);
    string(dto.accountId, `${path}.accountId`);
    optional(dto.hash, string, `${path}.hash`);
    optional(dto.userOpHash, string, `${path}.userOpHash`);
    optional(dto.to, string, `${path}.to`);
    string(dto.value, `${path}.value`);
    optional(dto.data, string, `${path}.data`);
    const status = string(dto.status, `${path}.status`);
    if (!['pending', 'queued', 'processing', 'submitted', 'confirmed', 'failed', 'retrying', 'cancelled'].includes(status)) {
        throw new Error(`${path}.status is not a canonical transaction status`);
    }
    number(dto.chainId, `${path}.chainId`);
    string(dto.createdAt, `${path}.createdAt`);
    string(dto.updatedAt, `${path}.updatedAt`);
};

export interface TransactionMutationPayload {
    transactionId: string;
    status: TransactionStatus;
    createdAt: string;
    transaction: TransactionDto;
}

const transactionMutationPayload = (
    value: unknown,
    path = 'data'
): asserts value is TransactionMutationPayload => {
    const payload = object(value, path);
    string(payload.transactionId, `${path}.transactionId`);
    string(payload.status, `${path}.status`);
    string(payload.createdAt, `${path}.createdAt`);
    transactionDto(payload.transaction, `${path}.transaction`);
};

export async function deploySmartAccount(
    chainId: number,
    walletID: string,
    paymasterID: string = 'ALCHEMY',
    bundlerID: string = 'ALCHEMY',
    token?: string
): Promise<ApiResponse<TransactionMutationPayload>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<TransactionMutationPayload>('/api/transactions/deploy', {
        method: 'POST',
        headers,
        body: JSON.stringify({ chainId, walletID, paymasterID, bundlerID }),
    }, transactionMutationPayload);
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
): Promise<ApiResponse<TransactionMutationPayload>> {
    const payload: Record<string, unknown> = {
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

    return apiClient.request<TransactionMutationPayload>('/api/transactions/send', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    }, transactionMutationPayload);
}

export interface SendTransactionBatchRequest {
        calls: { to: string; value?: string; data?: string }[];
        chainId: number;
        walletID: string;
        paymasterID: string;
        bundlerID: string;
        idempotencyKey?: string;
        sessionKeyAddress?: string;
        sessionKeySignature?: string;
}

export async function sendTransactionBatch(
    payload: SendTransactionBatchRequest,
    token?: string
): Promise<ApiResponse<TransactionMutationPayload>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<TransactionMutationPayload>('/api/transactions/batch', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    }, transactionMutationPayload);
}

export type GasEstimatePayload = {
    gasEstimate: Record<string, unknown>;
};

export async function estimateGas(
    chainId: number,
    bundlerID: string,
    paymasterID: string,
    walletID: string,
    to: Address,
    data?: string,
    value?: string,
    token?: string
): Promise<ApiResponse<GasEstimatePayload>> {
    const payload: Record<string, unknown> = {
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

    return apiClient.request<GasEstimatePayload>('/api/transactions/estimate_gas', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    }, (value, path = 'data'): asserts value is GasEstimatePayload => {
        const payload = object(value, path);
        objectData(payload.gasEstimate, `${path}.gasEstimate`);
    });
}

export async function getTransactionByHash(idOrHash: string, token?: string): Promise<ApiResponse<{ transaction: TransactionHistory }>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<{ transaction: TransactionHistory }>(
        `/api/transactions/${idOrHash}`,
        { headers },
        (value, path = 'data'): asserts value is { transaction: TransactionHistory } => {
            const payload = object(value, path);
            (transactionHistoryDto as (candidate: unknown, candidatePath?: string) => void)(
                payload.transaction,
                `${path}.transaction`
            );
        }
    );
}

export interface OperationReceipt {
    id: string;
    status: string;
    transactionHash: string;
    gasUsed: number;
}

export async function getOperationStatus(
    userOpHash: string,
    chainId: number,
    bundlerId: string,
    token?: string
): Promise<ApiResponse<{ receipts: OperationReceipt[] }>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<{ receipts: OperationReceipt[] }>('/api/transactions/user_op', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ userOpHash, chainId, bundlerId }),
    }, (value, path = 'data'): asserts value is { receipts: OperationReceipt[] } => {
        const payload = object(value, path);
        if (!Array.isArray(payload.receipts)) throw new Error(`${path}.receipts must be an array`);
        payload.receipts.forEach((receipt, index) => {
            const item = object(receipt, `${path}.receipts[${index}]`);
            string(item.id, `${path}.receipts[${index}].id`);
            string(item.status, `${path}.receipts[${index}].status`);
            string(item.transactionHash, `${path}.receipts[${index}].transactionHash`);
            number(item.gasUsed, `${path}.receipts[${index}].gasUsed`);
        });
    });
}

export async function getGasPrice(
    chainId: number,
    bundlerID: string
): Promise<ApiResponse<Record<string, unknown>>> {
    return apiClient.request<Record<string, unknown>>(
        `/api/transactions/gas_price?chainId=${chainId}&bundlerID=${encodeURIComponent(bundlerID)}`,
        {},
        objectData
    );
}
