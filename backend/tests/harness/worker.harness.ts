import { executeTransactionOnChain } from "../../src/services/transaction.service";
import { ITransaction } from "../../src/models";
import { bundlerProvider } from "../../src/services/provider.service";

jest.mock("../../src/services/provider.service", () => ({
    bundlerProvider: {
        getBundlerClient: jest.fn(),
        getGasPrice: jest.fn(),
        getUserOperation: jest.fn(),
    },
    rpcProvider: {
        getTransactionCount: jest.fn().mockResolvedValue(0),
    }
}));

describe("Worker Transaction Execution Harness", () => {
    let mockTx: jest.Mocked<ITransaction>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockTx = {
            id: "tx-harness-123",
            userId: "user-123",
            accountId: "0xaccountId",
            to: "0xrecipientAddress",
            value: "0.05",
            data: "0x",
            bundlerID: "ALCHEMY",
            paymasterID: "ALCHEMY",
            walletID: "ALCHEMY",
            chainId: 84532,
            status: "queued",
            retryCount: 0,
            save: jest.fn().mockResolvedValue(true),
        } as unknown as jest.Mocked<ITransaction>;
    });

    it("should process and confirm transaction on-chain via the worker harness", async () => {
        const mockBundlerClient = {
            sendUserOperation: jest.fn().mockResolvedValue("0xuserop-hash"),
            waitForUserOperationReceipt: jest.fn().mockResolvedValue({
                success: true,
                actualGasUsed: 50000n,
                receipt: { transactionHash: "0xtx-hash" }
            }),
        };
        (bundlerProvider.getBundlerClient as jest.Mock).mockResolvedValue(mockBundlerClient);

        await executeTransactionOnChain(mockTx);

        expect(mockTx.status).toBe("confirmed");
        expect(mockTx.hash).toBe("0xtx-hash");
        expect(mockTx.save).toHaveBeenCalled();
    });

    it("should handle transient worker execution failures and increment retry count", async () => {
        const mockBundlerClient = {
            sendUserOperation: jest.fn().mockRejectedValue(new Error("Timeout calling RPC")),
        };
        (bundlerProvider.getBundlerClient as jest.Mock).mockResolvedValue(mockBundlerClient);

        await executeTransactionOnChain(mockTx);

        expect(mockTx.status).toBe("retrying");
        expect(mockTx.retryCount).toBe(1);
        expect(mockTx.failureReason).toContain("Transient failure");
    });
});
