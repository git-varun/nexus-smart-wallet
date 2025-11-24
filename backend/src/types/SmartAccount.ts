// Smart Account domain types
import {Document} from "mongoose";

export interface SmartAccount {
    id: string;
    userId: string;
    address: string;
    chainId: number;
    isDeployed: boolean;
    balance?: string;
    nonce?: number;
    signerAddress?: string;
    alchemyAccountId?: string;
    requestId?: string;
    salt?: string;
    accountType?: string;
    factoryAddress?: string;
    isActive?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface SmartAccountDocument extends Omit<SmartAccount, 'id'>, Document {
    _id: string;
}