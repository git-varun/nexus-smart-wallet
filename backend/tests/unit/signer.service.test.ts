import { custodialSigner } from "../../src/services/signer.service";

describe("CustodialSigner Service Unit Tests", () => {
    it("should return the public address of the EOA", async () => {
        const address = await custodialSigner.getAddress();
        expect(address).toBeDefined();
        expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it("should sign messages successfully without exposing private keys", async () => {
        const hash = "0x8e8a60e0a5ea79d27038dd4df8b56f8f74a0088924b17f54c9d5d5ea6e0b7410" as `0x${string}`;
        const signature = await custodialSigner.signMessage(hash);
        expect(signature).toBeDefined();
        expect(signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
    });

    it("should return a wrapped viem local account", () => {
        const localAccount = custodialSigner.getViemAccount();
        expect(localAccount).toBeDefined();
        expect(localAccount.address).toBeDefined();
        expect(localAccount.type).toBe("local");
        expect(localAccount.source).toBe("custom-signer");
        
        // Private key should not be exposed in localAccount object keys
        expect(Object.keys(localAccount)).not.toContain("privateKey");
    });
});
