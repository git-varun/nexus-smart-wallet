// src/shared/api/client.ts
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        status?: number;
    };
}

export interface RequestTelemetry {
    id: string;
    endpoint: string;
    method: string;
    timestamp: string;
    durationMs: number;
    status: number;
    success: boolean;
    retries: number;
}

export interface ErrorRecord {
    id: string;
    timestamp: string;
    category: 'API' | 'Validation' | 'Capability' | 'Network' | 'Auth' | 'SSE' | 'Runtime';
    message: string;
    code?: string;
    status?: number;
    stack?: string;
}

// Global API Request & Error Telemetry Registries
export const apiTelemetry: RequestTelemetry[] = [];
export const errorTelemetry: ErrorRecord[] = [];

export const recordError = (
    category: ErrorRecord['category'],
    message: string,
    code?: string,
    status?: number,
    stack?: string
) => {
    // Scrub authorization secrets or session keys from messages
    const cleanMessage = message
        .replace(/bearer\s+[a-zA-Z0-9_\-.]+/gi, 'Bearer [REDACTED_SECRET]')
        .replace(/0x[a-fA-F0-9]{64}/g, '0x[REDACTED_HEX]');
        
    const newError: ErrorRecord = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        category,
        message: cleanMessage,
        code,
        status,
        stack
    };

    errorTelemetry.unshift(newError);
    if (errorTelemetry.length > 50) {
        errorTelemetry.pop();
    }
    window.dispatchEvent(new CustomEvent('nexus-error-telemetry', { detail: newError }));
};

const recordTelemetry = (
    endpoint: string,
    method: string,
    start: number,
    timestamp: string,
    status: number,
    success: boolean,
    retries: number
) => {
    // Strip query parameters to scrub signatures/secrets
    const cleanEndpoint = endpoint.split('?')[0];
    const durationMs = Math.round(performance.now() - start);

    const record: RequestTelemetry = {
        id: Math.random().toString(36).substring(2, 9),
        endpoint: cleanEndpoint,
        method: method || 'GET',
        timestamp,
        durationMs,
        status,
        success,
        retries
    };

    apiTelemetry.unshift(record);
    if (apiTelemetry.length > 50) {
        apiTelemetry.pop();
    }
    window.dispatchEvent(new CustomEvent('nexus-api-telemetry', { detail: record }));
};

export class ApiClient {
    private baseUrl: string;
    private refreshPromise: Promise<string | null> | null = null;

    constructor() {
        this.baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000';
    }

    private async performRefresh(): Promise<string | null> {
        const refreshToken = localStorage.getItem('nexus_refresh_token');
        if (!refreshToken) return null;

        try {
            const url = `${this.baseUrl}/api/auth/refresh`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });

            if (!response.ok) {
                throw new Error('Refresh failed');
            }

            const data = await response.json();
            if (data.success && data.data) {
                const { token, refreshToken: newRefreshToken } = data.data;
                localStorage.setItem('nexus_auth_token', token);
                localStorage.setItem('nexus_refresh_token', newRefreshToken);
                return token;
            }
            return null;
        } catch (err) {
            console.error('Silent token refresh failed:', err);
            localStorage.removeItem('nexus_auth_token');
            localStorage.removeItem('nexus_refresh_token');
            return null;
        }
    }

    async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
        const url = `${this.baseUrl}${endpoint}`;
        const start = performance.now();
        const timestamp = new Date().toISOString();
        const method = options.method || 'GET';
        
        // Build headers dict safely
        const headers: Record<string, string> = {};
        if (options.headers) {
            Object.entries(options.headers).forEach(([k, v]) => {
                if (v !== undefined && v !== null) {
                    headers[k] = String(v);
                }
            });
        }

        if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        // Request Interceptor: Auto-attach authorization token if available
        if (!headers['Authorization']) {
            const token = localStorage.getItem('nexus_auth_token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        const config: RequestInit = {
            ...options,
            headers,
        };

        const isMutation = config.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method.toUpperCase());
        const maxRetries = isMutation ? 0 : 2;
        let attempt = 0;
        let lastError: any = null;

        while (attempt <= maxRetries) {
            try {
                if (attempt > 0) {
                    const delay = Math.pow(2, attempt) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }

                const response = await fetch(url, config);

                // Response Interceptor: 401 Unauthorized detection
                // Response Interceptor: 401 Unauthorized detection / Silent refresh
                if (response.status === 401 && endpoint !== '/api/auth/refresh') {
                    if (!this.refreshPromise) {
                        this.refreshPromise = this.performRefresh();
                    }

                    const newAccessToken = await this.refreshPromise;
                    this.refreshPromise = null;

                    if (newAccessToken) {
                        headers['Authorization'] = `Bearer ${newAccessToken}`;
                        const retryConfig = { ...config, headers };
                        const retryResponse = await fetch(url, retryConfig);
                        if (retryResponse.ok) {
                            const retryData = await retryResponse.json();
                            recordTelemetry(endpoint, method, start, timestamp, retryResponse.status, true, attempt);
                            return retryData;
                        }
                    } else {
                        console.warn('⚠️ HTTP 401 Unauthorized. Cleared session keys.');
                        localStorage.removeItem('nexus_auth_token');
                        localStorage.removeItem('nexus_refresh_token');
                        window.dispatchEvent(new Event('nexus-auth-unauthorized'));
                        recordError('Auth', 'Session token expired or is invalid.', 'UNAUTHORIZED', 401);
                    }
                }

                if (!response.ok) {
                    // Retry only on 5xx server issues or transient status codes
                    if (response.status >= 500 && attempt < maxRetries) {
                        attempt++;
                        continue;
                    }

                    let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
                    let errorCode = 'HTTP_ERROR';
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.error?.message || errorMsg;
                        errorCode = errorData.error?.code || errorCode;
                    } catch {
                        // ignore parsing error
                    }

                    const category = response.status === 401 ? 'Auth' : (response.status === 400 ? 'Validation' : 'API');
                    recordError(category, errorMsg, errorCode, response.status);
                    recordTelemetry(endpoint, method, start, timestamp, response.status, false, attempt);
                    
                    return {
                        success: false,
                        error: {
                            code: errorCode,
                            message: errorMsg,
                            status: response.status
                        }
                    };
                }

                const data = await response.json();
                recordTelemetry(endpoint, method, start, timestamp, response.status, true, attempt);
                return data;

            } catch (error) {
                lastError = error;
                console.error(`Request attempt ${attempt + 1} failed for ${endpoint}:`, error);

                if (attempt < maxRetries) {
                    attempt++;
                } else {
                    break;
                }
            }
        }

        // Error Normalization for local exceptions / offline states
        const networkMsg = lastError instanceof Error ? lastError.message : 'Network request failed';
        recordError('Network', networkMsg, 'NETWORK_ERROR', 0, lastError instanceof Error ? lastError.stack : undefined);
        recordTelemetry(endpoint, method, start, timestamp, 0, false, attempt);
        
        return {
            success: false,
            error: {
                code: 'NETWORK_ERROR',
                message: networkMsg,
                status: 0
            }
        };
    }
}

export const apiClient = new ApiClient();
