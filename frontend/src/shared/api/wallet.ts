// src/shared/api/wallet.ts
import { apiClient, ApiResponse } from './client';
import { SmartAccountInfo } from '@/types/account';
import { boolean, object, smartAccountDto } from './contracts';

export interface CreateSmartAccountRequest {
    chainId: number;
    walletID: string;
    accountType: string;
}

export interface CreateSmartAccountPayload {
    smartAccount: SmartAccountInfo;
    account: SmartAccountInfo;
    alreadyExists: boolean;
}

const createAccountPayload = (
    value: unknown,
    path = 'data'
): asserts value is CreateSmartAccountPayload => {
    const payload = object(value, path);
    smartAccountDto(payload.smartAccount, `${path}.smartAccount`);
    smartAccountDto(payload.account, `${path}.account`);
    boolean(payload.alreadyExists, `${path}.alreadyExists`);
};

export async function createSmartAccount(
    data: CreateSmartAccountRequest,
    token?: string
): Promise<ApiResponse<CreateSmartAccountPayload>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<CreateSmartAccountPayload>('/api/accounts/create', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
    }, createAccountPayload);
}

export interface AccountsPayload {
    accounts: SmartAccountInfo[];
}

const accountsPayload = (value: unknown, path = 'data'): asserts value is AccountsPayload => {
    const payload = object(value, path);
    if (!Array.isArray(payload.accounts)) throw new Error(`${path}.accounts must be an array`);
    payload.accounts.forEach((account, index) => smartAccountDto(account, `${path}.accounts[${index}]`));
};

export async function getMySmartAccounts(chainId: number, token?: string): Promise<ApiResponse<AccountsPayload>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<AccountsPayload>(`/api/accounts/me?chainId=${chainId}`, { headers }, accountsPayload);
}

export interface AccountDetailsPayload {
    account: SmartAccountInfo;
}

const accountDetailsPayload = (value: unknown, path = 'data'): asserts value is AccountDetailsPayload => {
    const payload = object(value, path);
    smartAccountDto(payload.account, `${path}.account`);
};

export async function getSmartAccountDetails(
    address: string,
    chainId: number,
    token?: string
): Promise<ApiResponse<AccountDetailsPayload>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<AccountDetailsPayload>(
        `/api/accounts/${address}?chainId=${chainId}`,
        { headers },
        accountDetailsPayload
    );
}
