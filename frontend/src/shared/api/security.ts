// src/shared/api/security.ts
import { apiClient, ApiResponse } from './client';

export async function createSessionKey(data: any, token?: string): Promise<ApiResponse<any>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<any>('/api/sessions/create', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
    });
}

export async function getSessionKeys(chainId: number, ownerAddress: string, token?: string): Promise<ApiResponse<any[]>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<any[]>(`/api/sessions?chainId=${chainId}&ownerAddress=${encodeURIComponent(ownerAddress)}`, { headers });
}

export async function revokeSessionKey(publicKey: string, token?: string): Promise<ApiResponse<any>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<any>('/api/sessions/revoke', {
        method: 'POST',
        headers,
        body: JSON.stringify({ publicKey }),
    });
}

export async function validateSessionKey(
    publicKey: string,
    targetContract?: string,
    functionSelector?: string,
    value?: string,
    token?: string
): Promise<ApiResponse<{ isValid: boolean }>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<{ isValid: boolean }>('/api/sessions/validate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
            publicKey,
            targetContract: targetContract || '0x0000000000000000000000000000000000000000',
            functionSelector: functionSelector || '0x00000000',
            value: value || '0'
        }),
    });
}
