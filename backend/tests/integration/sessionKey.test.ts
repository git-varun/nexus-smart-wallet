process.env.MASTER_WALLET_PRIVATE_KEY = "0x0123456789012345678901234567890123456789012345678901234567890123";
process.env.JWT_SECRET = "supersecretjwtsecretmustbe32characterslong!!!";

import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { privateKeyToAccount } from "viem/accounts";
import createApp from "../../src/app";
import { generateToken } from "../../src/services/auth.service";
import { UserModel, AccountModel, SessionKeyModel } from "../../src/models";

describe("Session Key Cryptographic Registration Integration Tests", () => {
    let mongoServer: MongoMemoryServer;
    let app: any;
    let userToken: string;
    let userId: string;
    let userEmail: string;

    const testOwnerPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const testOwnerAccount = privateKeyToAccount(testOwnerPrivateKey);
    const testOwnerAddress = testOwnerAccount.address;

    const validSessionPublicKey = "0x1111111111111111111111111111111111111111";
    const validTargetContract = "0x2222222222222222222222222222222222222222";

    beforeAll(async () => {
        // Spin up in-memory MongoDB
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);

        // Build Express app
        app = await createApp();
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
        await UserModel.deleteMany({});
        await AccountModel.deleteMany({});
        await SessionKeyModel.deleteMany({});

        // Create a test user
        userEmail = `test-${Date.now()}@example.com`;
        const user = new UserModel({
            email: userEmail,
            password: "HashedSecurePassword123!",
            username: `u_${Date.now() % 10000000}`
        });
        await user.save();
        userId = user._id.toString();

        // Generate token
        userToken = generateToken(userId, userEmail);
    });

    it("should reject request when auth token is missing", async () => {
        const response = await request(app)
            .post("/api/sessions/create")
            .send({
                ownerAddress: testOwnerAddress,
                publicKey: validSessionPublicKey,
                chainId: 84532,
                permissions: [{
                    target: validTargetContract,
                    allowedFunctions: ["0xa9059cbb"],
                    spendingLimit: "1000000000"
                }]
            });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
    });

    it("should reject registration if input parameter validation fails", async () => {
        const response = await request(app)
            .post("/api/sessions/create")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                ownerAddress: "not-an-address", // fails schema validation
                publicKey: validSessionPublicKey,
                chainId: 84532,
                permissions: []
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject session key registration if the user does not own the smart account", async () => {
        const otherUser = new UserModel({
            email: "other@example.com",
            password: "Password123!",
            username: "otheruser"
        });
        await otherUser.save();

        const account = new AccountModel({
            userId: otherUser._id.toString(),
            address: testOwnerAddress,
            chainId: 84532,
            walletID: "ALCHEMY",
            signerAddress: testOwnerAddress,
            isDeployed: true
        });
        await account.save();

        const response = await request(app)
            .post("/api/sessions/create")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                ownerAddress: testOwnerAddress,
                publicKey: validSessionPublicKey,
                chainId: 84532,
                permissions: [{
                    target: validTargetContract,
                    allowedFunctions: ["0xa9059cbb"],
                    spendingLimit: "100000000000000000"
                }]
            });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toContain("You do not own this smart account");
    });

    it("should successfully register a session key with valid cryptographic signature from the owner", async () => {
        // Create the user's smart account linked to our testOwnerAddress signer
        const account = new AccountModel({
            userId: userId,
            address: testOwnerAddress,
            chainId: 84532,
            walletID: "ALCHEMY",
            signerAddress: testOwnerAddress,
            isDeployed: true
        });
        await account.save();

        const expiresAt = new Date(Date.now() + 3600000).toISOString();
        const message = `Register session key: ${validSessionPublicKey.toLowerCase()}\nOwner: ${testOwnerAddress.toLowerCase()}\nChain ID: 84532\nExpires At: ${expiresAt}`;

        // Cryptographically sign the message
        const signature = await testOwnerAccount.signMessage({ message });

        const response = await request(app)
            .post("/api/sessions/create")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                ownerAddress: testOwnerAddress,
                publicKey: validSessionPublicKey,
                chainId: 84532,
                expiresAt,
                signature,
                permissions: [{
                    target: validTargetContract,
                    allowedFunctions: ["0xa9059cbb"],
                    spendingLimit: "100000000000000000"
                }]
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.publicKey).toBe(validSessionPublicKey.toLowerCase());
        expect(response.body.data.signature).toBe(signature);
    });

    it("should reject registration if the owner cryptographic signature is invalid", async () => {
        const account = new AccountModel({
            userId: userId,
            address: testOwnerAddress,
            chainId: 84532,
            walletID: "ALCHEMY",
            signerAddress: testOwnerAddress,
            isDeployed: true
        });
        await account.save();

        const expiresAt = new Date(Date.now() + 3600000).toISOString();
        const badSignature = "0x" + "0".repeat(130); // dummy invalid signature format (not matching signed output of message)

        const response = await request(app)
            .post("/api/sessions/create")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                ownerAddress: testOwnerAddress,
                publicKey: validSessionPublicKey,
                chainId: 84532,
                expiresAt,
                signature: badSignature,
                permissions: [{
                    target: validTargetContract,
                    allowedFunctions: ["0xa9059cbb"],
                    spendingLimit: "100000000000000000"
                }]
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe("INVALID_SIGNATURE");
    });
});
