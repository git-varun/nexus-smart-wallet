// src/entities/sessionKey/model/adapter.ts
import { SessionKey as ApiSessionKey } from '@/services/apiClient';
import { SessionKey } from '@/types/session';

export function toSessionKey(dto: ApiSessionKey): SessionKey {
    const primaryPermission = dto.permissions[0];
    const spendingLimit = primaryPermission?.spendingLimit || '0';
    return {
        key: dto.publicKey || dto.id,
        spendingLimit,
        dailyLimit: spendingLimit,
        usedToday: '0',
        lastUsedDay: 0,
        expiryTime: Math.floor(new Date(dto.expiresAt).getTime() / 1000),
        allowedTargets: dto.permissions.map((p: any) => p.target),
        isActive: dto.isActive,
        permissions: dto.permissions.map((p: any) => ({
            target: p.target,
            allowedFunctions: p.allowedFunctions,
            spendingLimit: p.spendingLimit
        })),
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
        revokedAt: dto.revokedAt,
        chainId: dto.chainId,
        ownerAddress: dto.ownerAddress,
        userId: dto.userId
    };
}
