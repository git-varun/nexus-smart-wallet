// src/shared/api/capabilities.ts
import { apiClient, ApiResponse } from './client';

export async function getCapabilities(): Promise<ApiResponse<any>> {
    return apiClient.request<any>('/api/capabilities');
}

export async function validateCompatibility(data: any): Promise<ApiResponse<any>> {
    return apiClient.request<any>('/api/capabilities/validate', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}
