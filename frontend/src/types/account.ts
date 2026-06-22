// frontend/src/types/account.ts
export interface User {
    id: string;
    email: string;
    username?: string;
    profileImage?: string;
    displayName?: string;
    preferences?: any;
    createdAt?: string;
    lastLogin?: string;
}

export interface SmartAccountInfo {
    id: string
    address: string
    chainId: number
    isDeployed: boolean
    walletID: string
    accountType: string
    balance?: string
    nonce?: number
    createdAt: string
    updatedAt: string
}

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
    logs: any[]
    receipt: any
}
