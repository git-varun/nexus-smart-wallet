// src/shared/api/wallet.ts
import { apiClient, ApiResponse } from './client';
import { SmartAccountInfo } from '@/types/account';

export async function createSmartAccount(data: any, token?: string): Promise<ApiResponse<SmartAccountInfo>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<SmartAccountInfo>('/api/accounts/create', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
    });
}

export async function getMySmartAccounts(token?: string): Promise<ApiResponse<SmartAccountInfo[]>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<SmartAccountInfo[]>('/api/accounts/me', { headers });
}

export async function getSmartAccountDetails(address: string, token?: string): Promise<ApiResponse<SmartAccountInfo>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<SmartAccountInfo>(`/api/accounts/${address}`, { headers });
}
