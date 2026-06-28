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

export type {
    ApiResponse,
    User,
    SmartAccountInfo,
    TransactionResult,
    TransactionHistory,
};

class ApiClient {
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
        return authApi.getProfile(token);
    }

    async updateProfile(token: string, data: any) {
        return authApi.updateProfile(data, token);
    }

    async checkUsernameAvailability(token: string, username: string) {
        return authApi.checkUsernameAvailability(username, token);
    }

    async uploadAvatar(token: string, file: File) {
        return authApi.uploadAvatar(file, token);
    }

    async updateAvatarConfig(token: string, config: any) {
        return authApi.updateAvatarConfig(config, token);
    }

    async deleteProfileImage(token: string) {
        return authApi.deleteProfileImage(token);
    }

    // Wallet/Account API
    async createSmartAccount(
        token: string,
        chainId: number,
        walletID: string,
        accountType: string
    ) {
        return walletApi.createSmartAccount({ chainId, walletID, accountType }, token);
    }

    async getMySmartAccounts(token: string) {
        return walletApi.getMySmartAccounts(token);
    }

    async getUserAccounts(token: string, chainId?: number) {
        const response = await walletApi.getMySmartAccounts(token);
        if (response.success && response.data) {
            const filtered = chainId 
                ? response.data.filter(acc => acc.chainId === chainId)
                : response.data;
            return {
                success: true,
                data: { accounts: filtered }
            } as ApiResponse<{ accounts: SmartAccountInfo[] }>;
        }
        return {
            success: false,
            error: response.error
        } as ApiResponse<{ accounts: SmartAccountInfo[] }>;
    }

    async getSmartAccountDetails(token: string, address: string) {
        return walletApi.getSmartAccountDetails(address, token);
    }

    // Portfolio API
    async getPortfolio(token: string, address: string, chainId: number) {
        return portfolioApi.getPortfolio(address, chainId, token);
    }

    async refreshPortfolio(token: string, address: string, chainId: number) {
        return portfolioApi.refreshPortfolio(address, chainId, token);
    }

    // Session Key API
    async createSessionKey(token: string, data: any) {
        return securityApi.createSessionKey(data, token);
    }

    async getSessionKeys(token: string, chainId: number, ownerAddress: string) {
        return securityApi.getSessionKeys(chainId, ownerAddress, token);
    }

    async revokeSessionKey(token: string, publicKey: string) {
        return securityApi.revokeSessionKey(publicKey, token);
    }

    async validateSessionKey(token: string, publicKey: string, targetContract?: string, functionSelector?: string, value?: string) {
        return securityApi.validateSessionKey(publicKey, targetContract, functionSelector, value, token);
    }

    // Transaction API
    async deploySmartAccount(token: string, chainId: number, walletID: string, paymasterID: string = 'ALCHEMY', bundlerID: string = 'ALCHEMY') {
        return transactionApi.deploySmartAccount(chainId, walletID, paymasterID, bundlerID, token);
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
        return transactionApi.sendTransaction(to, data, value ? formatEther(value) : '0', providers, token);
    }

    async sendTransactionBatch(token: string, payload: any) {
        return transactionApi.sendTransactionBatch(payload, token);
    }

    async estimateGas(token: string, chainId: number, bundlerID: string, paymasterID: string, walletID: string, to: Address, data?: string, value?: bigint) {
        return transactionApi.estimateGas(chainId, bundlerID, paymasterID, walletID, to, data, value ? formatEther(value) : '0', token);
    }

    async getTransactionByHash(token: string, idOrHash: string) {
        const response = await transactionApi.getTransactionByHash(idOrHash, token);
        if (response.success && response.data) {
            return {
                success: true,
                data: { transaction: response.data.transaction }
            } as ApiResponse<{ transaction: TransactionHistory }>;
        }
        return {
            success: false,
            error: response.error
        } as ApiResponse<{ transaction: TransactionHistory }>;
    }

    async getTransactionHistory(token: string, params: any = {}) {
        return activityApi.getTransactionHistory(params, token);
    }

    // Capabilities API
    async getCapabilities() {
        return capabilitiesApi.getCapabilities();
    }

    async validateCompatibility(data: any) {
        return capabilitiesApi.validateCompatibility(data);
    }

    async getHealthCheck() {
        return baseClient.request<any>('/api/health');
    }

    async getLiveness() {
        return baseClient.request<any>('/api/health/liveness');
    }

    async getReadiness() {
        return baseClient.request<any>('/api/health/readiness');
    }

    async getStartup() {
        return baseClient.request<any>('/api/health/startup');
    }

    async getMetrics(metricsKey?: string) {
        const headers: Record<string, string> = {};
        if (metricsKey) {
            headers['x-metrics-key'] = metricsKey;
        }
        return baseClient.request<any>('/api/metrics', { headers });
    }

    async request<T>(path: string, options?: any) {
        return baseClient.request<T>(path, options);
    }
}

export const apiClient = new ApiClient();
export default apiClient;
