process.env.MASTER_WALLET_PRIVATE_KEY = "0x0123456789012345678901234567890123456789012345678901234567890123";
process.env.JWT_SECRET = "supersecretjwtsecretmustbe32characterslong!!!";

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { getNextNonce } from "../../src/services/transaction.service";
import { NonceModel } from "../../src/models";

describe("Nonce Manager Concurrency Integration Tests", () => {
    let mongoServer: MongoMemoryServer;
    const smartAccountAddress = "0x" + "a".repeat(40);
    const chainId = 84532;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
    });

    afterAll(async () => {
        const { closeRedis } = require("../../src/services/redis.service");
        const { notificationService } = require("../../src/services/notification.service");
        await notificationService.shutdown();
        await closeRedis();

        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        await NonceModel.deleteMany({});
    });

    it("should generate strictly unique sequential nonces when getNextNonce is called concurrently", async () => {
        const initialOnChainNonce = 10n;
        const mockGetOnChainNonce = jest.fn().mockResolvedValue(initialOnChainNonce);

        const concurrencyCount = 50;
        const promises = [];

        // Spin off 50 concurrent getNextNonce calls
        for (let i = 0; i < concurrencyCount; i++) {
            promises.push(getNextNonce(smartAccountAddress, chainId, mockGetOnChainNonce));
        }

        const results = await Promise.all(promises);

        // Convert bigints to numbers for comparison
        const nonces = results.map(n => Number(n));

        // 1. Verify we got exactly 50 nonces
        expect(nonces.length).toBe(concurrencyCount);

        // 2. Verify all nonces are unique
        const uniqueNonces = new Set(nonces);
        expect(uniqueNonces.size).toBe(concurrencyCount);

        // 3. Verify they are exactly in the sequential range [10, 59]
        const minNonce = Math.min(...nonces);
        const maxNonce = Math.max(...nonces);
        expect(minNonce).toBe(10);
        expect(maxNonce).toBe(59);

        // 4. Verify the database state has incremented to 60 (initialOnChainNonce + concurrencyCount)
        const record = await NonceModel.findOne({ signerAddress: smartAccountAddress.toLowerCase(), chainId });
        expect(record).not.toBeNull();
        expect(record?.nonce).toBe(60);
    });
});
