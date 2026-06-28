import { spawn, ChildProcess } from "child_process";
import { createPublicClient, createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { localhost } from "viem/chains";

describe("Local EVM (Anvil) Integration Tests", () => {
    let anvilProcess: ChildProcess;
    const ANVIL_PORT = 8545;
    const ANVIL_URL = `http://127.0.0.1:${ANVIL_PORT}`;

    // Standard Anvil test account private key and address
    const testPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const testAccount = privateKeyToAccount(testPrivateKey);

    // Recipient account
    const recipientPrivateKey = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
    const recipientAccount = privateKeyToAccount(recipientPrivateKey);

    beforeAll(async () => {
        // Programmatically start Anvil matching localhost chain ID 1337
        anvilProcess = spawn("anvil", ["--port", ANVIL_PORT.toString(), "--chain-id", "1337"]);
        
        // Wait for Anvil to start up
        await new Promise((resolve) => setTimeout(resolve, 2000));
    });

    afterAll(() => {
        // Kill Anvil process
        if (anvilProcess) {
            anvilProcess.kill();
        }
    });

    it("should connect to the local Anvil node and query block information", async () => {
        const publicClient = createPublicClient({
            chain: localhost,
            transport: http(ANVIL_URL)
        });

        const blockNumber = await publicClient.getBlockNumber();
        expect(blockNumber).toBeDefined();
        expect(Number(blockNumber)).toBeGreaterThanOrEqual(0);
    });

    it("should query balances and submit a transaction on the local Anvil node", async () => {
        const publicClient = createPublicClient({
            chain: localhost,
            transport: http(ANVIL_URL)
        });

        const walletClient = createWalletClient({
            account: testAccount,
            chain: localhost,
            transport: http(ANVIL_URL)
        });

        const balanceBefore = await publicClient.getBalance({ address: testAccount.address });
        expect(balanceBefore).toBeGreaterThan(0n);

        const recipientBalanceBefore = await publicClient.getBalance({ address: recipientAccount.address });

        // Send 1 ETH to recipient
        const sendAmount = parseEther("1");
        const txHash = await walletClient.sendTransaction({
            to: recipientAccount.address,
            value: sendAmount
        });

        expect(txHash).toBeDefined();
        expect(txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

        // Wait for transaction confirmation (instant on local anvil)
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        expect(receipt.status).toBe("success");

        const recipientBalanceAfter = await publicClient.getBalance({ address: recipientAccount.address });
        expect(recipientBalanceAfter).toBe(recipientBalanceBefore + sendAmount);
    });
});
