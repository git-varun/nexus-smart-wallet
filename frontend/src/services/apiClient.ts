import {Address} from 'viem';

// API Response types matching backend
interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}

// Request/Response types

interface User {
    id: string;
    email: string;
    createdAt: string;
    lastLogin?: string;
}

interface SmartAccountInfo {
    id: string;
    address: Address;
    chainId: number;
    isDeployed: boolean;
    walletID: string;
    accountType: string;
    balance?: string;
    nonce?: number;
    createdAt: string;
    updatedAt: string;
}

interface TransactionRequest {
    to: Address;
    data?: string;
    value?: string; // Will be converted from bigint
}

interface TransactionResult {
    id: string;
    hash: string;
    userOpHash?: string;
    to: string;
    value?: string;
    data?: string;
    status: 'pending' | 'confirmed' | 'failed';
    gasUsed?: string;
    createdAt: string;
    updatedAt: string;
}

interface TransactionHistory {
    id: string;
    hash: string;
    userOpHash?: string;
    to: Address;
    value: string;
    data?: string;
    status: 'pending' | 'confirmed' | 'failed';
    gasUsed?: string;
    createdAt: string;
    updatedAt: string;
}

interface GasEstimate {
    gasEstimate: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
}

interface SessionPermission {
    target: Address;
    allowedFunctions: string[];
    spendingLimit: string;
}

interface SessionKey {
    id: string;
    publicKey: string;
    permissions: SessionPermission[];
    expiresAt: string;
    isActive: boolean;
}

interface RecoveryRequest {
    id: string;
    accountAddress: Address;
    guardians: Address[];
    threshold: number;
    status: 'pending' | 'completed' | 'failed';
    createdAt: string;
}

class ApiClient {
    private baseUrl: string;

    constructor() {
        // Use environment variable or default to the backend dev port.
        this.baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000';
    }

    // Authentication API - Updated to match backend routes
    async getAuthStatus(token?: string): Promise<ApiResponse<{ authenticated: boolean; user: User | null }>> {
        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return this.request<{ authenticated: boolean; user: User | null }>('/api/auth/status', {
            headers,
        });
    }

    async register(email: string, password: string): Promise<ApiResponse<{
        user: User;
        token: string;
    }>> {
        return this.request<{ user: User; token: string }>('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({email, password}),
        });
    }

    async login(email: string, password: string): Promise<ApiResponse<{
        user: User;
        token: string;
    }>> {
        return this.request<{ user: User; token: string }>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({email, password}),
        });
    }

    async authenticate(email: string, password: string): Promise<ApiResponse<{
        user: User;
        token: string;
    }>> {
        return this.request<{ user: User; token: string }>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    async logout(token?: string): Promise<ApiResponse<{ message: string }>> {
        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return this.request<{ message: string }>('/api/auth/logout', {
            method: 'POST',
            headers,
        });
    }

    // Account API - Updated to match backend structure
    async createSmartAccount(
        token: string,
        chainId: number,
        walletID: string,
        accountType: string = 'default'
    ): Promise<ApiResponse<{ smartAccount: SmartAccountInfo }>> {
        return this.request<{ smartAccount: SmartAccountInfo }>('/api/accounts/create', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ chainId, walletID, accountType }),
        });
    }

    async getAccountByAddress(address: Address, chainId?: number): Promise<ApiResponse<{ account: SmartAccountInfo }>> {
        const searchParams = new URLSearchParams();
        if (chainId) {
            searchParams.append('chainId', chainId.toString());
        }

        const query = searchParams.toString();
        return this.request<{ account: SmartAccountInfo }>(`/api/accounts/${address}${query ? `?${query}` : ''}`);
    }

    async deploySmartAccount(
        token: string,
        chainId: number,
        walletID: string,
        paymasterID: string = 'ALCHEMY',
        bundlerID: string = 'ALCHEMY'
    ): Promise<ApiResponse<{ transaction: TransactionResult; account?: SmartAccountInfo }>> {
        return this.request<{ transaction: TransactionResult; account?: SmartAccountInfo }>('/api/transactions/deploy', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({chainId, walletID, paymasterID, bundlerID}),
        });
    }

    async getUserAccounts(token: string, chainId?: number): Promise<ApiResponse<{ accounts: SmartAccountInfo[] }>> {
        const searchParams = new URLSearchParams();
        if (chainId) {
            searchParams.append('chainId', chainId.toString());
        }

        const query = searchParams.toString();
        return this.request<{ accounts: SmartAccountInfo[] }>(`/api/accounts/me${query ? `?${query}` : ''}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }

    // Transaction API - Updated to match backend structure
    async sendTransaction(
        token: string,
        to: Address,
        data?: string,
        value?: bigint,
        providers?: { bundlerID: string; paymasterID: string; walletID: string; chainId: number }
    ): Promise<ApiResponse<{ transaction: TransactionResult }>> {
        const payload: any = {
            to,
            data: data || '0x',
            value: value ? value.toString() : '0',
        };

        // Add provider information if provided
        if (providers) {
            payload.bundlerID = providers.bundlerID;
            payload.paymasterID = providers.paymasterID;
            payload.walletID = providers.walletID;
            payload.chainId = providers.chainId;
        }

        return this.request<{ transaction: TransactionResult }>('/api/transactions/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });
    }

    async getTransactionByHash(hash: string): Promise<ApiResponse<{ transaction: TransactionHistory }>> {
        return this.request<{ transaction: TransactionHistory }>(`/api/transactions/${hash}`);
    }

    async getTransactionHistory(token: string, chainId?: number, limit?: number): Promise<ApiResponse<{
        transactions: TransactionHistory[];
        count: number
    }>> {
        const searchParams = new URLSearchParams();
        if (chainId) searchParams.append('chainId', chainId.toString());
        if (limit) searchParams.append('limit', limit.toString());

        const query = searchParams.toString();
        return this.request<{
            transactions: TransactionHistory[];
            count: number
        }>(`/api/transactions/history${query ? `?${query}` : ''}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }

    // Profile API
    async getProfile(token: string): Promise<ApiResponse<User>> {
        return this.request<User>('/api/profile', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }

    async updateProfile(token: string, data: any): Promise<ApiResponse<User>> {
        return this.request<User>('/api/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
    }

    async checkUsernameAvailability(token: string, username: string): Promise<ApiResponse<{ available: boolean }>> {
        return this.request<{ available: boolean }>(`/api/username/check?username=${encodeURIComponent(username)}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }

    async uploadAvatar(token: string, file: File): Promise<ApiResponse<{ profileImageUrl: string }>> {
        const formData = new FormData();
        formData.append('profileImage', file);

        return this.request<{ profileImageUrl: string }>('/api/avatar/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                // Fetch will automatically set the correct boundary for FormData
                'Content-Type': undefined as any,
            },
            body: formData,
        });
    }

    async estimateGas(
        token: string,
        chainId: number,
        bundlerID: string,
        paymasterID: string,
        walletID: string,
        to: Address,
        data?: string,
        value?: bigint
    ): Promise<ApiResponse<{ gasEstimate: string; gasLimit: string; breakdown: any }>> {
        const payload: any = {
            to,
            data: data || '0x',
            value: value ? value.toString() : '0',
            chainId,
            bundlerID,
            paymasterID,
            walletID
        };

        return this.request<{
            gasEstimate: string;
            gasLimit: string;
            breakdown: any
        }>('/api/transactions/estimate_gas', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });
    }

    // Health check - Updated to match backend route
    async getHealthCheck(): Promise<ApiResponse<{ success: boolean; timestamp: string; database: any; system: any }>> {
        return this.request<{ success: boolean; timestamp: string; database: any; system: any }>('/api/health');
    }

    // Session Key API
    async createSessionKey(token: string, data: any): Promise<ApiResponse<any>> {
        return this.request<any>('/api/sessions/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
    }

    async getSessionKeys(token: string, chainId: number): Promise<ApiResponse<any[]>> {
        return this.request<any[]>(`/api/sessions?chainId=${chainId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }

    // Recovery API - To be implemented in future versions

    // System stats
    async getSystemStats(): Promise<ApiResponse<{ users: any; accounts: any; transactions: any; sessions: any }>> {
        return this.request<{ users: any; accounts: any; transactions: any; sessions: any }>('/api/stats');
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseUrl}${endpoint}`;

        const headers: any = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (headers['Content-Type'] === null || headers['Content-Type'] === undefined) {
            delete headers['Content-Type'];
        }

        const config: RequestInit = {
            ...options,
            headers,
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                // Try to parse error response
                try {
                    const errorData = await response.json();
                    return {
                        success: false,
                        error: errorData.error || {
                            code: 'HTTP_ERROR',
                            message: `HTTP ${response.status}: ${response.statusText}`
                        }
                    };
                } catch {
                    return {
                        success: false,
                        error: {
                            code: 'HTTP_ERROR',
                            message: `HTTP ${response.status}: ${response.statusText}`
                        }
                    };
                }
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            return {
                success: false,
                error: {
                    code: 'NETWORK_ERROR',
                    message: error instanceof Error ? error.message : 'Network request failed'
                }
            };
        }
    }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;

// Export types for use in components
export type {
    ApiResponse,
    User,
    SmartAccountInfo,
    TransactionResult,
    TransactionHistory,
    GasEstimate,
    SessionPermission,
    SessionKey,
    RecoveryRequest,
};
