// src/entities/transaction/model/adapter.ts
import { TransactionHistory as DTO } from '@/shared/api/transaction';
import { TransactionDto } from '@/shared/api/contracts';

export interface Transaction {
    id: string;
    hash?: string;
    userOpHash?: string;
    to: string;
    value: string;
    data: string;
    status: 'pending' | 'success' | 'failed' | 'queued' | 'processing' | 'submitted' | 'retrying' | 'cancelled';
    timestamp: number;
    receipt?: unknown;
    failureReason?: string;
    gasUsed?: string;
    bundlerID?: string;
    paymasterID?: string;
    walletID?: string;
    retryCount?: number;
    queuedAt?: string;
    startedAt?: string;
    submittedAt?: string;
    confirmedAt?: string;
    completedAt?: string;
    executionDuration?: number;
    queueDuration?: number;
    blockchainDuration?: number;
    calls?: { to: string; value: string; data: string }[];
    chainId?: number;
    createdAt?: string;
    updatedAt?: string;
}

export function toTransaction(dto: DTO | TransactionDto): Transaction {
    return {
        id: dto.id,
        hash: dto.hash,
        userOpHash: dto.userOpHash,
        to: dto.to || '0x0000000000000000000000000000000000000000',
        value: dto.value || '0',
        data: dto.data || '0x',
        status: dto.status === 'confirmed' ? 'success' : dto.status,
        timestamp: new Date(dto.createdAt).getTime(),
        failureReason: dto.failureReason,
        gasUsed: dto.gasUsed,
        bundlerID: dto.bundlerID,
        paymasterID: dto.paymasterID,
        walletID: dto.walletID,
        retryCount: dto.retryCount,
        queuedAt: dto.queuedAt,
        startedAt: dto.startedAt,
        submittedAt: dto.submittedAt,
        confirmedAt: dto.confirmedAt,
        completedAt: dto.completedAt,
        executionDuration: dto.executionDuration,
        queueDuration: dto.queueDuration,
        blockchainDuration: dto.blockchainDuration,
        calls: dto.calls,
        chainId: dto.chainId,
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
    };
}
