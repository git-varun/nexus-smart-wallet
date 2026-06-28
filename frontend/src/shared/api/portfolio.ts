// src/shared/api/portfolio.ts
import { apiClient, ApiResponse } from './client';

export async function getPortfolio(address: string, chainId: number, token?: string): Promise<ApiResponse<any>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<any>(`/api/portfolio?address=${address}&chainId=${chainId}`, { headers });
}

export async function refreshPortfolio(address: string, chainId: number, token?: string): Promise<ApiResponse<any>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<any>('/api/portfolio/refresh', {
        method: 'POST',
        headers,
        body: JSON.stringify({ address, chainId }),
    });
}
