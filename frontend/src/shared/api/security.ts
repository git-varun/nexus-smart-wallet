// src/shared/api/security.ts
import { apiClient, ApiResponse } from './client';
import { object, optional, SessionKeyDto, sessionKeyDto, string, boolean } from './contracts';

export interface CreateSessionKeyRequest {
    ownerAddress: string;
    publicKey: string;
    chainId: number;
    permissions: Array<{ target: string; allowedFunctions: string[]; spendingLimit: string }>;
    expiresAt?: string;
    signature?: string;
}

export async function createSessionKey(
    data: CreateSessionKeyRequest,
    token?: string
): Promise<ApiResponse<SessionKeyDto>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<SessionKeyDto>('/api/sessions/create', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
    }, sessionKeyDto);
}

const sessionKeyList = (value: unknown, path = 'data'): asserts value is { sessionKeys: SessionKeyDto[] } => {
    const payload = object(value, path);
    if (!Array.isArray(payload.sessionKeys)) throw new Error(`${path}.sessionKeys must be an array`);
    payload.sessionKeys.forEach((item, index) => sessionKeyDto(item, `${path}.sessionKeys[${index}]`));
};

export async function getSessionKeys(chainId: number, ownerAddress: string, token?: string): Promise<ApiResponse<{ sessionKeys: SessionKeyDto[] }>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<{ sessionKeys: SessionKeyDto[] }>(
        `/api/sessions?chainId=${chainId}&ownerAddress=${encodeURIComponent(ownerAddress)}`,
        { headers },
        sessionKeyList
    );
}

export async function revokeSessionKey(publicKey: string, token?: string): Promise<ApiResponse<SessionKeyDto>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<SessionKeyDto>('/api/sessions/revoke', {
        method: 'POST',
        headers,
        body: JSON.stringify({ publicKey }),
    }, sessionKeyDto);
}

export async function validateSessionKey(
    publicKey: string,
    targetContract?: string,
    functionSelector?: string,
    value?: string,
    token?: string
): Promise<ApiResponse<{ isValid: boolean; error?: string }>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<{ isValid: boolean; error?: string }>('/api/sessions/validate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
            publicKey,
            targetContract: targetContract || '0x0000000000000000000000000000000000000000',
            functionSelector: functionSelector || '0x00000000',
            value: value || '0'
        }),
    }, (value, path = 'data'): asserts value is { isValid: boolean; error?: string } => {
        const payload = object(value, path);
        boolean(payload.isValid, `${path}.isValid`);
        optional(payload.error, string, `${path}.error`);
    });
}
