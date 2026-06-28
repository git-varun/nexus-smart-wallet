// src/shared/api/activity.ts
import { apiClient, ApiResponse } from './client';
import { TransactionHistory } from './transaction';

export async function getTransactionHistory(
    params: {
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
    } = {},
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
    }>(`/api/transactions/history${query ? `?${query}` : ''}`, { headers });
}
