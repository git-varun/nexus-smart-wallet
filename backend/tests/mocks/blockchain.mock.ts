import { PublicClient } from "viem";

export const mockPublicClient = {
    getTransactionCount: jest.fn().mockResolvedValue(0),
    readContract: jest.fn(),
    getBalance: jest.fn().mockResolvedValue(1000000000000000000n),
} as unknown as jest.Mocked<PublicClient>;

export const mockBundlerClient = {
    prepareUserOperation: jest.fn().mockResolvedValue({
        sender: "0x1234567890123456789012345678901234567890",
        nonce: 0n,
        initCode: "0x",
        callData: "0x",
        callGasLimit: 0n,
        verificationGasLimit: 0n,
        preVerificationGas: 0n,
        maxFeePerGas: 0n,
        maxPriorityFeePerGas: 0n,
        paymasterAndData: "0x",
        signature: "0x",
    }),
    estimateUserOperationGas: jest.fn().mockResolvedValue({
        preVerificationGas: 50000n,
        verificationGasLimit: 100000n,
        callGasLimit: 200000n,
    }),
    sendUserOperation: jest.fn().mockResolvedValue("0xuserop-hash-placeholder"),
    waitForUserOperationReceipt: jest.fn().mockResolvedValue({
        success: true,
        actualGasUsed: 120000n,
        receipt: {
            transactionHash: "0xtx-hash-placeholder",
        },
    }),
};

export const mockPaymasterProvider = {
    getPaymasterStubData: jest.fn().mockResolvedValue({
        paymasterAndData: "0xpaymaster-data-placeholder",
    }),
};

export const mockBundlerProvider = {
    getBundlerClient: jest.fn().mockResolvedValue(mockBundlerClient),
    getUserOperationReceipt: jest.fn().mockResolvedValue({
        success: true,
        actualGasUsed: 120000n,
        receipt: {
            transactionHash: "0xtx-hash-placeholder",
        },
    }),
    getUserOperation: jest.fn().mockResolvedValue({
        status: "confirmed",
        receipts: [
            {
                id: "1",
                status: "0x1",
                transactionHash: "0xtx-hash-placeholder",
                gasUsed: 120000,
            },
        ],
    }),
    getGasPrice: jest.fn().mockResolvedValue({
        maxFeePerGas: 1500000000n,
        maxPriorityFeePerGas: 100000000n,
    }),
    getGasPriceRaw: jest.fn().mockResolvedValue({
        gasPrice: {
            fast: { maxFeePerGas: "0x59682f00", maxPriorityFeePerGas: "0x5f5e100" },
            standard: { maxFeePerGas: "0x59682f00", maxPriorityFeePerGas: "0x5f5e100" },
            slow: { maxFeePerGas: "0x59682f00", maxPriorityFeePerGas: "0x5f5e100" }
        }
    }),
};
