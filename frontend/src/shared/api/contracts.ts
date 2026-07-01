export type ContractValidator<T> = (value: unknown, path?: string) => asserts value is T;

export class ApiContractError extends Error {
    constructor(
        public readonly endpoint: string,
        public readonly contractPath: string,
        detail: string
    ) {
        super(`API contract violation at ${contractPath}: ${detail}`);
        this.name = 'ApiContractError';
    }
}

const fail = (path: string, expected: string, value: unknown): never => {
    const actual = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
    throw new Error(`${path} must be ${expected}; received ${actual}`);
};

export const object = (value: unknown, path = 'data'): Record<string, unknown> => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path, 'an object', value);
    return value as Record<string, unknown>;
};

export const string = (value: unknown, path: string): string => {
    if (typeof value !== 'string') fail(path, 'a string', value);
    return value as string;
};

export const number = (value: unknown, path: string): number => {
    if (typeof value !== 'number' || !Number.isFinite(value)) fail(path, 'a finite number', value);
    return value as number;
};

export const boolean = (value: unknown, path: string): boolean => {
    if (typeof value !== 'boolean') fail(path, 'a boolean', value);
    return value as boolean;
};

export const array = <T>(
    value: unknown,
    itemValidator: ContractValidator<T>,
    path: string
): T[] => {
    if (!Array.isArray(value)) fail(path, 'an array', value);
    const values = value as unknown[];
    values.forEach((item, index) => {
        (itemValidator as (candidate: unknown, candidatePath?: string) => void)(item, `${path}[${index}]`);
    });
    return values as T[];
};

export const optional = <T>(
    value: unknown,
    validator: (value: unknown, path: string) => T,
    path: string
): T | undefined => value === undefined || value === null ? undefined : validator(value, path);

export const unknownValue: ContractValidator<unknown> = (_value: unknown): asserts _value is unknown => {};

export const undefinedValue: ContractValidator<undefined> = (
    value: unknown,
    path = 'data'
): asserts value is undefined => {
    if (value !== undefined) fail(path, 'absent', value);
};

export interface UserDto {
    id: string;
    email?: string;
    username?: string;
    displayName?: string;
    profileImageUrl?: string;
    avatarConfig?: {
        seed?: string;
        style?: string;
        backgroundColor?: string;
        textColor?: string;
        pattern?: string;
    };
    preferences?: {
        theme?: 'light' | 'dark' | 'auto';
        language?: string;
        notifications?: boolean;
        privacy?: {
            showEmail?: boolean;
            showOnlineStatus?: boolean;
        };
    };
    createdAt: string;
    lastLogin?: string;
}

export const userDto: ContractValidator<UserDto> = (value, path = 'data.user'): asserts value is UserDto => {
    const dto = object(value, path);
    string(dto.id, `${path}.id`);
    optional(dto.email, string, `${path}.email`);
    optional(dto.username, string, `${path}.username`);
    optional(dto.displayName, string, `${path}.displayName`);
    optional(dto.profileImageUrl, string, `${path}.profileImageUrl`);
    string(dto.createdAt, `${path}.createdAt`);
    optional(dto.lastLogin, string, `${path}.lastLogin`);
    if (dto.avatarConfig != null) object(dto.avatarConfig, `${path}.avatarConfig`);
    if (dto.preferences != null) object(dto.preferences, `${path}.preferences`);
};

export interface SmartAccountDto {
    id: string;
    userId: string;
    address: string;
    chainId: number;
    isDeployed: boolean;
    signerAddress?: string | null;
    providerInfo?: Record<string, unknown>;
    accountType?: string | null;
    walletID?: string | null;
    isActive: boolean;
    balance?: string;
    nonce?: number;
    createdAt: string;
    updatedAt: string;
}

export const smartAccountDto: ContractValidator<SmartAccountDto> = (
    value,
    path = 'data.account'
): asserts value is SmartAccountDto => {
    const dto = object(value, path);
    string(dto.id, `${path}.id`);
    string(dto.userId, `${path}.userId`);
    string(dto.address, `${path}.address`);
    number(dto.chainId, `${path}.chainId`);
    boolean(dto.isDeployed, `${path}.isDeployed`);
    boolean(dto.isActive, `${path}.isActive`);
    optional(dto.signerAddress, string, `${path}.signerAddress`);
    optional(dto.accountType, string, `${path}.accountType`);
    optional(dto.walletID, string, `${path}.walletID`);
    optional(dto.balance, string, `${path}.balance`);
    optional(dto.nonce, number, `${path}.nonce`);
    string(dto.createdAt, `${path}.createdAt`);
    string(dto.updatedAt, `${path}.updatedAt`);
};

export interface PortfolioAssetDto {
    type: 'native' | 'erc20' | 'erc721' | 'erc1155';
    tokenAddress?: string | null;
    tokenId?: string | null;
    symbol?: string;
    name?: string;
    decimals?: number;
    balance: string;
    metadata?: Record<string, unknown>;
}

export interface PortfolioDto {
    id: string;
    userId: string;
    address: string;
    chainId: number;
    assets: PortfolioAssetDto[];
    lastSyncedAt: string;
    createdAt: string;
    updatedAt: string;
}

export const portfolioDto: ContractValidator<PortfolioDto> = (
    value,
    path = 'data.portfolio'
): asserts value is PortfolioDto => {
    const dto = object(value, path);
    string(dto.id, `${path}.id`);
    string(dto.userId, `${path}.userId`);
    string(dto.address, `${path}.address`);
    number(dto.chainId, `${path}.chainId`);
    array(dto.assets, (asset, assetPath = `${path}.assets[]`): asserts asset is PortfolioAssetDto => {
        const item = object(asset, assetPath);
        const type = string(item.type, `${assetPath}.type`);
        if (!['native', 'erc20', 'erc721', 'erc1155'].includes(type)) {
            fail(`${assetPath}.type`, 'a supported asset type', type);
        }
        const balance = string(item.balance, `${assetPath}.balance`);
        if (!/^\d+$/.test(balance)) fail(`${assetPath}.balance`, 'an unsigned integer string', balance);
        optional(item.tokenAddress, string, `${assetPath}.tokenAddress`);
        optional(item.tokenId, string, `${assetPath}.tokenId`);
        optional(item.symbol, string, `${assetPath}.symbol`);
        optional(item.name, string, `${assetPath}.name`);
        optional(item.decimals, number, `${assetPath}.decimals`);
    }, `${path}.assets`);
    string(dto.lastSyncedAt, `${path}.lastSyncedAt`);
    string(dto.createdAt, `${path}.createdAt`);
    string(dto.updatedAt, `${path}.updatedAt`);
};

export type TransactionStatus =
    | 'pending' | 'queued' | 'processing' | 'submitted'
    | 'confirmed' | 'failed' | 'retrying' | 'cancelled';

export interface TransactionDto {
    id: string;
    userId: string;
    accountId: string;
    hash?: string;
    userOpHash?: string;
    to?: string;
    value?: string;
    data?: string;
    status: TransactionStatus;
    chainId: number;
    gasUsed?: string;
    bundlerID?: string;
    paymasterID?: string;
    walletID?: string;
    retryCount: number;
    failureReason?: string;
    queuedAt?: string;
    startedAt?: string;
    submittedAt?: string;
    confirmedAt?: string;
    completedAt?: string;
    executionDuration?: number;
    queueDuration?: number;
    blockchainDuration?: number;
    calls?: Array<{ to: string; value: string; data: string }>;
    createdAt: string;
    updatedAt: string;
}

export const transactionDto: ContractValidator<TransactionDto> = (
    value,
    path = 'data.transaction'
): asserts value is TransactionDto => {
    const dto = object(value, path);
    string(dto.id, `${path}.id`);
    string(dto.userId, `${path}.userId`);
    string(dto.accountId, `${path}.accountId`);
    const status = string(dto.status, `${path}.status`);
    if (!['pending', 'queued', 'processing', 'submitted', 'confirmed', 'failed', 'retrying', 'cancelled'].includes(status)) {
        fail(`${path}.status`, 'a transaction status enum value', status);
    }
    number(dto.chainId, `${path}.chainId`);
    number(dto.retryCount, `${path}.retryCount`);
    string(dto.createdAt, `${path}.createdAt`);
    string(dto.updatedAt, `${path}.updatedAt`);
    ['hash', 'userOpHash', 'to', 'value', 'data', 'gasUsed', 'bundlerID', 'paymasterID', 'walletID',
        'failureReason', 'queuedAt', 'startedAt', 'submittedAt', 'confirmedAt', 'completedAt']
        .forEach(key => optional((dto as unknown as Record<string, unknown>)[key], string, `${path}.${key}`));
};

export interface SessionPermissionDto {
    target: string;
    allowedFunctions: string[];
    spendingLimit: string;
}

export interface SessionKeyDto {
    id: string;
    userId: string;
    ownerAddress: string;
    publicKey: string;
    chainId: number;
    permissions: SessionPermissionDto[];
    expiresAt: string;
    isActive: boolean;
    revokedAt?: string;
    signature?: string;
    createdAt: string;
    updatedAt: string;
}

export const sessionKeyDto: ContractValidator<SessionKeyDto> = (
    value,
    path = 'data'
): asserts value is SessionKeyDto => {
    const dto = object(value, path);
    string(dto.id, `${path}.id`);
    string(dto.userId, `${path}.userId`);
    string(dto.ownerAddress, `${path}.ownerAddress`);
    string(dto.publicKey, `${path}.publicKey`);
    number(dto.chainId, `${path}.chainId`);
    array(dto.permissions, (permission, permissionPath = `${path}.permissions[]`): asserts permission is SessionPermissionDto => {
        const item = object(permission, permissionPath);
        string(item.target, `${permissionPath}.target`);
        array(item.allowedFunctions, (fn, fnPath = `${permissionPath}.allowedFunctions[]`): asserts fn is string => {
            string(fn, fnPath);
        }, `${permissionPath}.allowedFunctions`);
        string(item.spendingLimit, `${permissionPath}.spendingLimit`);
    }, `${path}.permissions`);
    string(dto.expiresAt, `${path}.expiresAt`);
    boolean(dto.isActive, `${path}.isActive`);
    string(dto.createdAt, `${path}.createdAt`);
    string(dto.updatedAt, `${path}.updatedAt`);
    optional(dto.revokedAt, string, `${path}.revokedAt`);
    optional(dto.signature, string, `${path}.signature`);
};

export interface HealthDto {
    status: 'UP' | 'DOWN';
    timestamp: string;
    service?: 'liveness' | 'startup';
    checks?: Record<string, { status: 'UP' | 'DOWN'; state?: number }>;
    error?: string;
}

export const healthDto: ContractValidator<HealthDto> = (value, path = 'response'): asserts value is HealthDto => {
    const dto = object(value, path);
    const status = string(dto.status, `${path}.status`);
    if (status !== 'UP' && status !== 'DOWN') fail(`${path}.status`, '"UP" or "DOWN"', status);
    string(dto.timestamp, `${path}.timestamp`);
    optional(dto.service, string, `${path}.service`);
    if (dto.checks != null) object(dto.checks, `${path}.checks`);
    optional(dto.error, string, `${path}.error`);
};

export interface MetricsDto {
    timestamp: string;
    api: Record<string, unknown>;
    worker: Record<string, unknown>;
    blockchain: Record<string, unknown>;
    sessionKeys: Record<string, unknown>;
    database: Record<string, unknown>;
    redis: Record<string, unknown>;
    performance: Record<string, unknown>;
}

export const metricsDto: ContractValidator<MetricsDto> = (
    value,
    path = 'response'
): asserts value is MetricsDto => {
    const dto = object(value, path);
    string(dto.timestamp, `${path}.timestamp`);
    ['api', 'worker', 'blockchain', 'sessionKeys', 'database', 'redis', 'performance']
        .forEach(key => object(dto[key], `${path}.${key}`));
};

export const objectData: ContractValidator<Record<string, unknown>> = (
    value,
    path = 'data'
): asserts value is Record<string, unknown> => {
    object(value, path);
};
