export interface SessionPermission {
    target: string;
    allowedFunctions: string[];
    spendingLimit: string;
}

export interface CreateSessionKeyParams {
    sessionKey: string;
    spendingLimit: string;
    dailyLimit: string;
    expiryTime: number;
    allowedTargets?: string[];
}

export interface SessionKey {
    key: string;
    spendingLimit: string;
    dailyLimit: string;
    usedToday: string;
    lastUsedDay: number;
    expiryTime: number;
    allowedTargets?: string[];
    isActive: boolean;
}
