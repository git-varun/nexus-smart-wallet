// src/shared/api/activity.ts
import { apiClient, ApiResponse } from './client';
import { TransactionHistory } from './transaction';
import { number, object, string } from './contracts';

export interface TransactionHistoryFilters {
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
}

export async function getTransactionHistory(
    params: TransactionHistoryFilters = {},
    token?: string
): Promise<ApiResponse<{
    transactions: TransactionHistory[];
    pagination: {
        totalCount: number;
        page: number;
        limit: number;
        totalPages: number;
    }
}>> {
    const searchParams = new URLSearchParams();
    if (params.chainId) searchParams.append('chainId', params.chainId.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.status) searchParams.append('status', params.status);
    if (params.search) searchParams.append('search', params.search);
    if (params.to) searchParams.append('to', params.to);
    if (params.paymasterID) searchParams.append('paymasterID', params.paymasterID);
    if (params.bundlerID) searchParams.append('bundlerID', params.bundlerID);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const query = searchParams.toString();
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return apiClient.request<{
        transactions: TransactionHistory[];
        pagination: {
            totalCount: number;
            page: number;
            limit: number;
            totalPages: number;
        }
    }>(`/api/transactions/history${query ? `?${query}` : ''}`, { headers }, (
        value,
        path = 'data'
    ): asserts value is {
        transactions: TransactionHistory[];
        pagination: { totalCount: number; page: number; limit: number; totalPages: number };
    } => {
        const payload = object(value, path);
        if (!Array.isArray(payload.transactions)) throw new Error(`${path}.transactions must be an array`);
        payload.transactions.forEach((transaction, index) => {
            const item = object(transaction, `${path}.transactions[${index}]`);
            string(item.id, `${path}.transactions[${index}].id`);
            string(item.accountId, `${path}.transactions[${index}].accountId`);
            string(item.value, `${path}.transactions[${index}].value`);
            string(item.status, `${path}.transactions[${index}].status`);
            number(item.chainId, `${path}.transactions[${index}].chainId`);
            string(item.createdAt, `${path}.transactions[${index}].createdAt`);
            string(item.updatedAt, `${path}.transactions[${index}].updatedAt`);
        });
        const pagination = object(payload.pagination, `${path}.pagination`);
        number(pagination.totalCount, `${path}.pagination.totalCount`);
        number(pagination.page, `${path}.pagination.page`);
        number(pagination.limit, `${path}.pagination.limit`);
        number(pagination.totalPages, `${path}.pagination.totalPages`);
    });
}
