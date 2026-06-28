process.env.MASTER_WALLET_PRIVATE_KEY = "0x0123456789012345678901234567890123456789012345678901234567890123";
process.env.JWT_SECRET = "supersecretjwtsecretmustbe32characterslong!!!";

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { TransactionModel } from "../../src/models";
import { startWorker, stopWorker, getWorkerStatus } from "../../src/services/worker.service";
import { bundlerProvider } from "../../src/services/provider.service";
import { reconcileAllAccountsDeploymentStatus } from "../../src/services/account.service";
import { runBackgroundPortfolioSync } from "../../src/services/portfolio.service";
import { executeTransactionOnChain } from "../../src/services/transaction.service";

jest.mock("../../src/services/provider.service", () => ({
    bundlerProvider: {
        getUserOperation: jest.fn(),
        getBundlerClient: jest.fn(),
        getGasPrice: jest.fn(),
    },
    paymasterProvider: {
        getPaymasterStubData: jest.fn(),
    },
    rpcProvider: {
        getTransactionCount: jest.fn(),
    }
}));

jest.mock("../../src/services/account.service", () => ({
    reconcileAllAccountsDeploymentStatus: jest.fn(),
}));

jest.mock("../../src/services/portfolio.service", () => ({
    runBackgroundPortfolioSync: jest.fn(),
}));

jest.mock("../../src/services/transaction.service", () => ({
    executeTransactionOnChain: jest.fn(),
}));

describe("Queue Worker Concurrency, Recovery and Crash Tests", () => {
    let mongoServer: MongoMemoryServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
    });

    afterAll(async () => {
        await stopWorker();
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        jest.clearAllMocks();
        await TransactionModel.deleteMany({});

        // Define mock implementations in beforeEach to bypass Jest resetMocks
        (reconcileAllAccountsDeploymentStatus as jest.Mock).mockResolvedValue(undefined);
        (runBackgroundPortfolioSync as jest.Mock).mockResolvedValue(undefined);
        (executeTransactionOnChain as jest.Mock).mockImplementation(async (tx) => {
            tx.status = 'confirmed';
            await tx.save();
        });
    });

    it("should recover stuck processing jobs and reset them to queued on startup", async () => {
        // Setup a stuck transaction in 'processing' status
        const tx = new TransactionModel({
            userId: "user-123",
            accountId: "0xaccount",
            to: "0xrecipient",
            value: "0.01",
            data: "0x",
            status: "processing",
            chainId: 84532,
            bundlerID: "ALCHEMY",
            paymasterID: "ALCHEMY",
            walletID: "ALCHEMY"
        });
        await tx.save();

        // Run worker start which triggers recovery
        await startWorker();
        expect(getWorkerStatus()).toBe(true);
        await stopWorker();

        // Check database status of the recovered transaction
        const updatedTx = await TransactionModel.findById(tx._id);
        expect(updatedTx?.status).toBe("queued");
        expect(updatedTx?.failureReason).toBe("Recovered after worker restart");
    });

    it("should recover stuck submitted transactions using bundler provider response", async () => {
        // Setup two stuck transactions in 'submitted' status
        const txConfirmed = new TransactionModel({
            userId: "user-123",
            accountId: "0xaccount",
            to: "0xrecipient",
            value: "0.01",
            data: "0x",
            status: "submitted",
            userOpHash: "0xuseropconfirmed",
            chainId: 84532,
            bundlerID: "ALCHEMY",
            paymasterID: "ALCHEMY",
            walletID: "ALCHEMY"
        });
        await txConfirmed.save();

        const txFailed = new TransactionModel({
            userId: "user-123",
            accountId: "0xaccount",
            to: "0xrecipient",
            value: "0.01",
            data: "0x",
            status: "submitted",
            userOpHash: "0xuseropfailed",
            chainId: 84532,
            bundlerID: "ALCHEMY",
            paymasterID: "ALCHEMY",
            walletID: "ALCHEMY"
        });
        await txFailed.save();

        const txStillPending = new TransactionModel({
            userId: "user-123",
            accountId: "0xaccount",
            to: "0xrecipient",
            value: "0.01",
            data: "0x",
            status: "submitted",
            userOpHash: "0xuseroppending",
            chainId: 84532,
            bundlerID: "ALCHEMY",
            paymasterID: "ALCHEMY",
            walletID: "ALCHEMY"
        });
        await txStillPending.save();

        // Mock the bundler responses
        (bundlerProvider.getUserOperation as jest.Mock).mockImplementation((hash: string) => {
            if (hash === "0xuseropconfirmed") {
                return Promise.resolve({ status: "confirmed", receipts: [{ transactionHash: "0xtxhashconfirmed" }] });
            }
            if (hash === "0xuseropfailed") {
                return Promise.resolve({ status: "failed" });
            }
            // Return null or undefined to simulate unresolved/still pending status
            return Promise.resolve(null);
        });

        // Run worker startup which triggers submitted tx recovery
        await startWorker();
        await stopWorker();

        // Validate outcomes
        const resConfirmed = await TransactionModel.findById(txConfirmed._id);
        expect(resConfirmed?.status).toBe("confirmed");
        expect(resConfirmed?.hash).toBe("0xtxhashconfirmed");

        const resFailed = await TransactionModel.findById(txFailed._id);
        expect(resFailed?.status).toBe("failed");
        expect(resFailed?.failureReason).toBe("UserOperation failed on-chain (recovered on restart)");

        const resPending = await TransactionModel.findById(txStillPending._id);
        // Stuck pending transaction should be rolled back to queued so worker can retry it
        expect(resPending?.status).toBe("queued");
        expect(resPending?.failureReason).toBe("Reset stuck submitted transaction on worker restart");
    });
});
