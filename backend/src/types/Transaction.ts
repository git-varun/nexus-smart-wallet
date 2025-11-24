// Transaction domain types
import {Document} from "mongoose";

export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface Transaction {
    id: string;
    userId: string;
    smartAccountId: string;
    hash: string;
    userOpHash?: string;
    to: string;
    value?: string;
    data?: string;
    status: TransactionStatus;
    gasUsed?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface TransactionInfo {
    id: string;
    hash: string;
    userOpHash?: string;
    to: string;
    value?: string;
    data?: string;
    status: 'pending' | 'confirmed' | 'failed';
    gasUsed?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface TransactionResult {
    success: boolean;
    transaction?: TransactionInfo;
    error?: string;
}

export interface TransactionDocument extends Omit<Transaction, 'id'>, Document {
    _id: string;
}
