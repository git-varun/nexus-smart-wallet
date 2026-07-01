// src/shared/api/capabilities.ts
import { apiClient, ApiResponse } from './client';
import { boolean, number, object, string } from './contracts';

export interface CapabilitiesPayload {
    supportedWallets: string[];
    supportedChains: Array<{ id: number; name: string }>;
    supportedBundlers: string[];
    supportedPaymasters: string[];
    sessionKeySupport: boolean;
    batchingSupport: boolean;
    deploymentSupport: boolean;
    gasSponsorshipSupport: boolean;
}

const stringList = (value: unknown, path: string): string[] => {
    if (!Array.isArray(value)) throw new Error(`${path} must be an array`);
    return value.map((item, index) => string(item, `${path}[${index}]`));
};

const capabilitiesPayload = (value: unknown, path = 'data'): asserts value is CapabilitiesPayload => {
    const payload = object(value, path);
    stringList(payload.supportedWallets, `${path}.supportedWallets`);
    if (!Array.isArray(payload.supportedChains)) throw new Error(`${path}.supportedChains must be an array`);
    payload.supportedChains.forEach((chain, index) => {
        const item = object(chain, `${path}.supportedChains[${index}]`);
        number(item.id, `${path}.supportedChains[${index}].id`);
        string(item.name, `${path}.supportedChains[${index}].name`);
    });
    stringList(payload.supportedBundlers, `${path}.supportedBundlers`);
    stringList(payload.supportedPaymasters, `${path}.supportedPaymasters`);
    boolean(payload.sessionKeySupport, `${path}.sessionKeySupport`);
    boolean(payload.batchingSupport, `${path}.batchingSupport`);
    boolean(payload.deploymentSupport, `${path}.deploymentSupport`);
    boolean(payload.gasSponsorshipSupport, `${path}.gasSponsorshipSupport`);
};

export interface CompatibilityRequest {
    bundlerID: string;
    paymasterID: string;
    walletID: string;
    chainId: number;
}

export interface CompatibilityPayload {
    compatible: boolean;
    message: string;
}

const compatibilityPayload = (value: unknown, path = 'data'): asserts value is CompatibilityPayload => {
    const payload = object(value, path);
    boolean(payload.compatible, `${path}.compatible`);
    string(payload.message, `${path}.message`);
};

export async function getCapabilities(): Promise<ApiResponse<CapabilitiesPayload>> {
    return apiClient.request<CapabilitiesPayload>('/api/capabilities', {}, capabilitiesPayload);
}

export async function validateCompatibility(data: CompatibilityRequest): Promise<ApiResponse<CompatibilityPayload>> {
    return apiClient.request<CompatibilityPayload>('/api/capabilities/validate', {
        method: 'POST',
        body: JSON.stringify(data),
    }, compatibilityPayload);
}
