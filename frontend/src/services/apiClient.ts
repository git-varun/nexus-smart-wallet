// src/services/apiClient.ts
import { Address, formatEther } from 'viem';
import { apiClient as baseClient, ApiResponse } from '@/shared/api/client';
import * as authApi from '@/shared/api/auth';
import * as walletApi from '@/shared/api/wallet';
import * as portfolioApi from '@/shared/api/portfolio';
import * as transactionApi from '@/shared/api/transaction';
import * as activityApi from '@/shared/api/activity';
import * as securityApi from '@/shared/api/security';
import * as capabilitiesApi from '@/shared/api/capabilities';
import { SmartAccountInfo, User } from '@/types/account';
import { TransactionHistory, TransactionResult } from '@/shared/api/transaction';
import { toPortfolio, Portfolio } from '@/entities/portfolio/model/adapter';
import { toSessionKey } from '@/entities/sessionKey/model/adapter';
import { toTransaction, Transaction } from '@/entities/transaction/model/adapter';
import { toCapabilities } from '@/entities/capability/model/adapter';
import { toSmartWallet, SmartWallet } from '@/entities/wallet/model/adapter';
import { healthDto, HealthDto, metricsDto, MetricsDto } from '@/shared/api/contracts';

export interface SessionPermission {
    target: Address;
    allowedFunctions: string[];
    spendingLimit: string;
}

export interface SessionKey {
    id: string;
    publicKey: string;
    permissions: SessionPermission[];
    expiresAt: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
    revokedAt?: string;
    chainId?: number;
    ownerAddress?: string;
    userId?: string;
}

export interface GasEstimate {
    gasEstimate: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
}

const errorResponse = <T>(response: ApiResponse<unknown>): ApiResponse<T> => ({
    success: false,
    error: response.error,
});

const gasEstimateFromDto = (dto: Record<string, unknown>): GasEstimate => {
    const fields = ['callGasLimit', 'verificationGasLimit', 'preVerificationGas'];
    const values = fields
        .map(field => dto[field])
        .filter((value): value is string | number => typeof value === 'string' || typeof value === 'number');
    if (values.length === 0) {
        throw new Error('Gas estimate payload has no canonical gas limit fields');
    }
    const total = values.reduce<bigint>((sum, value) => sum + BigInt(value), 0n);
    return {
        gasEstimate: total.toString(),
        gasPrice: typeof dto.gasPrice === 'string' ? dto.gasPrice : undefined,
        maxFeePerGas: typeof dto.maxFeePerGas === 'string' ? dto.maxFeePerGas : undefined,
        maxPriorityFeePerGas: typeof dto.maxPriorityFeePerGas === 'string' ? dto.maxPriorityFeePerGas : undefined,
    };
};

export type {
    ApiResponse,
    User,
    SmartAccountInfo,
    TransactionResult,
    TransactionHistory,
};

class ApiClient {
    get baseUrl() {
        return baseClient.baseUrl;
    }

    // Auth & Profile API
    async getAuthStatus(token?: string) {
        return authApi.getAuthStatus(token);
    }

    async register(email: string, password: string) {
        return authApi.register(email, password);
    }

    async login(email: string, password: string) {
        return authApi.login(email, password);
    }

    async authenticate(email: string, password: string) {
        return authApi.login(email, password);
    }

    async logout(token?: string) {
        // Suppress unused warning
        token;
        const refreshToken = localStorage.getItem('nexus_refresh_token');
        return authApi.logout(refreshToken || undefined);
    }

    async getProfile(token: string) {
        const response = await authApi.getProfile(token);
        return response.success && response.data
            ? { success: true, data: response.data.user } as ApiResponse<User>
            : errorResponse<User>(response);
    }

    async updateProfile(token: string, data: authApi.UserProfileUpdate) {
        const response = await authApi.updateProfile(data, token);
        return response.success && response.data
            ? { success: true, data: response.data.user } as ApiResponse<User>
            : errorResponse<User>(response);
    }

    async checkUsernameAvailability(token: string, username: string) {
        return authApi.checkUsernameAvailability(username, token);
    }

    async uploadAvatar(token: string, file: File) {
        return authApi.uploadAvatar(file, token);
    }

    async updateAvatarConfig(token: string, config: Record<string, unknown>) {
        const response = await authApi.updateAvatarConfig(config, token);
        return response.success && response.data
            ? { success: true, data: response.data.user } as ApiResponse<User>
            : errorResponse<User>(response);
    }

    async deleteProfileImage(token: string) {
        const response = await authApi.deleteProfileImage(token);
        return response.success && response.data
            ? { success: true, data: response.data.user } as ApiResponse<User>
            : errorResponse<User>(response);
    }

    // Wallet/Account API
    async createSmartAccount(
        token: string,
        chainId: number,
        walletID: string,
        accountType: string
    ) {
        const response = await walletApi.createSmartAccount({ chainId, walletID, accountType }, token);
        return response.success && response.data
            ? {
                success: true,
                data: {
                    account: toSmartWallet(response.data.account),
                    alreadyExists: response.data.alreadyExists,
                },
            } as ApiResponse<{ account: SmartWallet; alreadyExists: boolean }>
            : errorResponse<{ account: SmartWallet; alreadyExists: boolean }>(response);
    }

    async getMySmartAccounts(token: string, chainId?: number) {
        return walletApi.getMySmartAccounts(chainId || 84532, token);
    }

    async getUserAccounts(token: string, chainId?: number) {
        const response = await walletApi.getMySmartAccounts(chainId || 84532, token);
        if (response.success && response.data) {
            return {
                success: true,
                data: { accounts: response.data.accounts.map(toSmartWallet) }
            } as ApiResponse<{ accounts: SmartWallet[] }>;
        }
        return errorResponse<{ accounts: SmartWallet[] }>(response);
    }

    async getSmartAccountDetails(token: string, address: string, chainId?: number) {
        const response = await walletApi.getSmartAccountDetails(address, chainId || 84532, token);
        return response.success && response.data
            ? { success: true, data: toSmartWallet(response.data.account) } as ApiResponse<SmartWallet>
            : errorResponse<SmartWallet>(response);
    }

    // Portfolio API
    async getPortfolio(token: string, address: string, chainId: number) {
        const response = await portfolioApi.getPortfolio(address, chainId, token);
        return response.success && response.data
            ? { success: true, data: toPortfolio(response.data.portfolio) } as ApiResponse<Portfolio>
            : errorResponse<Portfolio>(response);
    }

    async refreshPortfolio(token: string, address: string, chainId: number) {
        const response = await portfolioApi.refreshPortfolio(address, chainId, token);
        return response.success && response.data
            ? { success: true, data: toPortfolio(response.data.portfolio) } as ApiResponse<Portfolio>
            : errorResponse<Portfolio>(response);
    }

    // Session Key API
    async createSessionKey(token: string, data: securityApi.CreateSessionKeyRequest) {
        const response = await securityApi.createSessionKey(data, token);
        return response.success && response.data
            ? { success: true, data: toSessionKey(response.data) }
            : errorResponse<ReturnType<typeof toSessionKey>>(response);
    }

    async getSessionKeys(token: string, chainId: number, ownerAddress: string) {
        const response = await securityApi.getSessionKeys(chainId, ownerAddress, token);
        return response.success && response.data
            ? { success: true, data: response.data.sessionKeys.map(toSessionKey) }
            : errorResponse<ReturnType<typeof toSessionKey>[]>(response);
    }

    async revokeSessionKey(token: string, publicKey: string) {
        const response = await securityApi.revokeSessionKey(publicKey, token);
        return response.success && response.data
            ? { success: true, data: toSessionKey(response.data) }
            : errorResponse<ReturnType<typeof toSessionKey>>(response);
    }

    async validateSessionKey(token: string, publicKey: string, targetContract?: string, functionSelector?: string, value?: string) {
        return securityApi.validateSessionKey(publicKey, targetContract, functionSelector, value, token);
    }

    // Transaction API
    async deploySmartAccount(token: string, chainId: number, walletID: string, paymasterID: string = 'ALCHEMY', bundlerID: string = 'ALCHEMY') {
        const response = await transactionApi.deploySmartAccount(chainId, walletID, paymasterID, bundlerID, token);
        return response.success && response.data
            ? { success: true, data: { transaction: toTransaction(response.data.transaction) } }
            : errorResponse<{ transaction: Transaction }>(response);
    }

    async sendTransaction(
        token: string,
        to: Address,
        data?: string,
        value?: bigint,
        providers?: { 
            bundlerID: string; 
            paymasterID: string; 
            walletID: string; 
            chainId: number;
            sessionKeyAddress?: string;
            sessionKeySignature?: string;
        }
    ) {
        const response = await transactionApi.sendTransaction(
            to, data, value ? formatEther(value) : '0', providers, token
        );
        return response.success && response.data
            ? { success: true, data: { transaction: toTransaction(response.data.transaction) } }
            : errorResponse<{ transaction: Transaction }>(response);
    }

    async sendTransactionBatch(token: string, payload: transactionApi.SendTransactionBatchRequest) {
        const response = await transactionApi.sendTransactionBatch(payload, token);
        return response.success && response.data
            ? { success: true, data: { transaction: toTransaction(response.data.transaction) } }
            : errorResponse<{ transaction: Transaction }>(response);
    }

    async estimateGas(token: string, chainId: number, bundlerID: string, paymasterID: string, walletID: string, to: Address, data?: string, value?: bigint) {
        const response = await transactionApi.estimateGas(
            chainId, bundlerID, paymasterID, walletID, to, data, value ? formatEther(value) : '0', token
        );
        return response.success && response.data
            ? { success: true, data: gasEstimateFromDto(response.data.gasEstimate) } as ApiResponse<GasEstimate>
            : errorResponse<GasEstimate>(response);
    }

    async getTransactionByHash(token: string, idOrHash: string) {
        const response = await transactionApi.getTransactionByHash(idOrHash, token);
        if (response.success && response.data) {
            return {
                success: true,
                data: { transaction: toTransaction(response.data.transaction) }
            } as ApiResponse<{ transaction: Transaction }>;
        }
        return {
            success: false,
            error: response.error
        } as ApiResponse<{ transaction: Transaction }>;
    }

    async getTransactionHistory(token: string, params: activityApi.TransactionHistoryFilters = {}) {
        const response = await activityApi.getTransactionHistory(params, token);
        return response.success && response.data
            ? {
                success: true,
                data: {
                    transactions: response.data.transactions.map(toTransaction),
                    pagination: response.data.pagination,
                },
            }
            : errorResponse<{
                transactions: Transaction[];
                pagination: { totalCount: number; page: number; limit: number; totalPages: number };
            }>(response);
    }

    // Capabilities API
    async getCapabilities() {
        const response = await capabilitiesApi.getCapabilities();
        return response.success && response.data
            ? { success: true, data: toCapabilities(response.data) }
            : errorResponse<ReturnType<typeof toCapabilities>>(response);
    }

    async validateCompatibility(data: capabilitiesApi.CompatibilityRequest) {
        return capabilitiesApi.validateCompatibility(data);
    }

    async getHealthCheck() {
        return baseClient.requestRaw<HealthDto>('/api/health', {}, healthDto);
    }

    async getLiveness() {
        return baseClient.requestRaw<HealthDto>('/api/health/liveness', {}, healthDto);
    }

    async getReadiness() {
        return baseClient.requestRaw<HealthDto>('/api/health/readiness', {}, healthDto);
    }

    async getStartup() {
        return baseClient.requestRaw<HealthDto>('/api/health/startup', {}, healthDto);
    }

    async getGasPrice(chainId: number, bundlerID = 'ALCHEMY') {
        return transactionApi.getGasPrice(chainId, bundlerID);
    }

    async getMetrics(metricsKey?: string) {
        const headers: Record<string, string> = {};
        if (metricsKey) {
            headers['x-metrics-key'] = metricsKey;
        }
        return baseClient.requestRaw<MetricsDto>('/api/metrics', { headers }, metricsDto);
    }

}

export const apiClient = new ApiClient();
export default apiClient;
