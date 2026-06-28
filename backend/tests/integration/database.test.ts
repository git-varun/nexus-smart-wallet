process.env.MASTER_WALLET_PRIVATE_KEY = "0x0123456789012345678901234567890123456789012345678901234567890123";
process.env.JWT_SECRET = "supersecretjwtsecretmustbe32characterslong!!!";
process.env.PIMLICO_API_KEY = "pim_mockkey";
process.env.ALCHEMY_API_KEY = "mock_key";

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createUser, deleteUser, findById, findByEmail } from "../../src/repositories/userRepository";
import { createAccount, findAccountByAddress, deleteAccount } from "../../src/repositories/accountRepository";
import { UserModel, AccountModel } from "../../src/models";

describe("MongoDB Real Database Integration Tests", () => {
    let mongoServer: MongoMemoryServer;

    beforeAll(async () => {
        // Spin up an in-memory MongoDB instance
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
    });

    afterAll(async () => {
        // Disconnect and stop the in-memory database
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    it("should perform user CRUD operations successfully in MongoDB", async () => {
        const uniqueEmail = `test-integration-${Date.now()}@example.com`;
        
        // 1. Create User
        const testUser = await createUser({
            email: uniqueEmail,
            password: "somehashedpassword",
            username: `usr_${Date.now() % 10000000}`
        });
        
        expect(testUser._id).toBeDefined();
        expect(testUser.email).toBe(uniqueEmail);

        // 2. Find User
        const found = await findByEmail(uniqueEmail);
        expect(found).not.toBeNull();
        expect(found?.email).toBe(uniqueEmail);

        // 3. Update / Delete
        const deleted = await deleteUser(testUser._id.toString());
        expect(deleted).toBe(true);

        const notFound = await findById(testUser._id.toString());
        expect(notFound).toBeNull();
    });

    it("should perform account CRUD operations successfully in MongoDB", async () => {
        const uniqueEmail = `test-integration-acc-${Date.now()}@example.com`;
        const testUserForAcc = await createUser({
            email: uniqueEmail,
            password: "somehashedpassword",
            username: `usr_${Date.now() % 10000000}`
        });

        const mockAddress = `0xmockaddress${Date.now().toString(16)}`.padEnd(42, "0").substring(0, 42);

        // 1. Create Account
        const testAccount = await createAccount({
            userId: testUserForAcc._id.toString(),
            address: mockAddress,
            chainId: 84532,
            walletID: "ALCHEMY",
            signerAddress: "0x1234567890123456789012345678901234567890",
            isDeployed: false
        });

        expect(testAccount._id).toBeDefined();
        expect(testAccount.address).toBe(mockAddress.toLowerCase());

        // 2. Find Account
        const foundAcc = await findAccountByAddress(mockAddress);
        expect(foundAcc).not.toBeNull();
        expect(foundAcc?.address).toBe(mockAddress.toLowerCase());

        // 3. Clean up
        await deleteAccount(testAccount._id.toString());
        await deleteUser(testUserForAcc._id.toString());
    });
});
