// Canonical wire DTO aliases. Domain adapters convert nullable/optional API fields
// into stricter UI models.
export type {
    UserDto as User,
    SmartAccountDto as SmartAccountInfo,
} from '@/shared/api/contracts';

export interface UserOperation {
    sender: string
    nonce: string
    initCode: string
    callData: string
    callGasLimit: string
    verificationGasLimit: string
    preVerificationGas: string
    maxFeePerGas: string
    maxPriorityFeePerGas: string
    paymasterAndData: string
    signature: string
}

export interface UserOperationReceipt {
    userOpHash: string
    entryPoint: string
    sender: string
    nonce: string
    paymaster?: string
    actualGasCost: string
    actualGasUsed: string
    success: boolean
    logs: unknown[]
    receipt: unknown
}
