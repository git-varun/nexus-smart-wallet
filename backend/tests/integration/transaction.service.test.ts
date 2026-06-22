process.env.MASTER_WALLET_PRIVATE_KEY = "0x0123456789012345678901234567890123456789012345678901234567890123";
process.env.JWT_SECRET = "supersecretjwtsecretmustbe32characterslong!!!";

import { sendTransaction, estimateGas } from "../../src/services/transaction.service";
import { bundlerProvider, paymasterProvider } from "../../src/services/provider.service";
import { mockBundlerProvider, mockPaymasterProvider, mockBundlerClient } from "../mocks/blockchain.mock";
import { getUserAccount } from "../../src/services/account.service";
import { transactionRepository } from "../../src/repositories";

// Mock the provider registry exports
jest.mock("../../src/services/provider.service", () => ({
    bundlerProvider: {
        getBundlerClient: jest.fn(),
        getGasPrice: jest.fn(),
        getUserOperation: jest.fn(),
    },
    paymasterProvider: {
        getPaymasterStubData: jest.fn(),
    },
    rpcProvider: {
        getTransactionCount: jest.fn().mockResolvedValue(0),
    }
}));

// Mock repositories to bypass database calls
jest.mock("../../src/repositories");

// Mock account service to bypass database calls
jest.mock("../../src/services/account.service");

describe("Transaction Service Integration Tests", () => {
    const mockUserId = "user-123";
    const mockChainId = 84532; // Base Sepolia
    const mockWalletID = "ALCHEMY";
    const mockPaymasterID = "ALCHEMY";
    const mockBundlerID = "ALCHEMY";

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mock resolved value for getUserAccount
        (getUserAccount as jest.Mock).mockResolvedValue({
            success: true,
            account: {
                id: "account-123",
                userId: "user-123",
                address: "0x1234567890123456789012345678901234567890",
                chainId: 84532,
                walletID: "ALCHEMY",
                isDeployed: true,
            }
        });

        // Setup mock for transactionRepository
        (transactionRepository.createTransaction as jest.Mock).mockImplementation((data) => Promise.resolve({
            id: "tx-123",
            status: "queued",
            createdAt: new Date(),
            updatedAt: new Date(),
            retryCount: 0,
            ...data,
            save: jest.fn().mockResolvedValue(true),
        }));
        (transactionRepository.findTransactionByIdempotencyKey as jest.Mock).mockResolvedValue(null);
        (transactionRepository.findTransactionByHash as jest.Mock).mockResolvedValue(null);
        
        // Wire mock clients
        (bundlerProvider.getGasPrice as jest.Mock).mockResolvedValue({
            maxFeePerGas: 1500000000n,
            maxPriorityFeePerGas: 100000000n,
        });
        (bundlerProvider.getBundlerClient as jest.Mock).mockResolvedValue(mockBundlerClient);
        
        // Explicitly set mockBundlerClient method implementations
        (mockBundlerClient.prepareUserOperation as jest.Mock).mockResolvedValue({
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
        });
        (mockBundlerClient.estimateUserOperationGas as jest.Mock).mockResolvedValue({
            preVerificationGas: 50000n,
            verificationGasLimit: 100000n,
            callGasLimit: 200000n,
        });

        (paymasterProvider.getPaymasterStubData as jest.Mock).mockResolvedValue({
            paymasterAndData: "0xpaymaster-stub-data",
        });
    });

    it("should enqueue a valid transaction successfully", async () => {
        const txRequest = {
            to: "0x1234567890123456789012345678901234567890" as `0x${string}`,
            value: "0.01",
            data: "0x" as `0x${string}`,
            chainId: mockChainId,
            walletID: mockWalletID,
            paymasterID: mockPaymasterID,
            bundlerID: mockBundlerID,
        };

        const result = await sendTransaction(mockUserId, mockChainId, mockWalletID, mockPaymasterID, mockBundlerID, txRequest);
        expect(result.success).toBe(true);
        expect(result.transaction).toBeDefined();
        expect(result.transaction?.status).toBe("queued");
    });

    it("should estimate gas via the mock provider successfully", async () => {
        const txRequest = {
            to: "0x1234567890123456789012345678901234567890" as `0x${string}`,
            value: "0",
            data: "0x" as `0x${string}`,
            chainId: mockChainId,
            walletID: mockWalletID,
            paymasterID: mockPaymasterID,
            bundlerID: mockBundlerID,
        };

        const result = await estimateGas(mockUserId, mockChainId, mockWalletID, mockPaymasterID, mockBundlerID, txRequest);
        expect(result.success).toBe(true);
        expect(result.gasEstimate).toBeDefined();
    });
});
