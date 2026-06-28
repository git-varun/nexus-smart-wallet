// src/entities/wallet/model/adapter.ts
import { SmartAccountInfo } from '@/types/account';

export interface SmartWallet {
    id: string;
    address: string;
    chainId: number;
    isDeployed: boolean;
    walletID: string;
    accountType: string;
    balance: string;
    nonce: number;
    createdAt: Date;
    updatedAt: Date;
    signerAddress?: string;
}

export function toSmartWallet(dto: SmartAccountInfo): SmartWallet {
    return {
        id: dto.id,
        address: dto.address,
        chainId: dto.chainId,
        isDeployed: dto.isDeployed,
        walletID: dto.walletID,
        accountType: dto.accountType,
        balance: dto.balance || '0',
        nonce: dto.nonce || 0,
        createdAt: new Date(dto.createdAt),
        updatedAt: new Date(dto.updatedAt),
        signerAddress: dto.signerAddress,
    };
}
