// src/entities/capability/model/adapter.ts

export interface Chain {
    id: number;
    name: string;
}

export interface FrontendCapabilities {
    supportedWallets: string[];
    supportedChains: Chain[];
    supportedBundlers: string[];
    supportedPaymasters: string[];
    sessionKeySupport: boolean;
    batchingSupport: boolean;
    deploymentSupport: boolean;
    gasSponsorshipSupport: boolean;
}

export function toCapabilities(dto: any): FrontendCapabilities {
    return {
        supportedWallets: dto.supportedWallets || [],
        supportedChains: (dto.supportedChains || []).map((c: any) => ({
            id: Number(c.id || c.chainId),
            name: String(c.name || c.chainName || ''),
        })),
        supportedBundlers: dto.supportedBundlers || [],
        supportedPaymasters: dto.supportedPaymasters || [],
        sessionKeySupport: typeof dto.sessionKeySupport === 'boolean' ? dto.sessionKeySupport : false,
        batchingSupport: typeof dto.batchingSupport === 'boolean' ? dto.batchingSupport : false,
        deploymentSupport: typeof dto.deploymentSupport === 'boolean' ? dto.deploymentSupport : false,
        gasSponsorshipSupport: typeof dto.gasSponsorshipSupport === 'boolean' ? dto.gasSponsorshipSupport : false,
    };
}
