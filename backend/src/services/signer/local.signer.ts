import { privateKeyToAccount } from "viem/accounts";
import { LocalAccount } from "viem";
import { ISigner } from "./signer.interface";

export class LocalSigner implements ISigner {
    private account: LocalAccount;

    constructor(privateKey: string) {
        if (!privateKey || !/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
            throw new Error("Invalid private key format for LocalSigner.");
        }
        this.account = privateKeyToAccount(privateKey as `0x${string}`);
    }

    public async getAddress(): Promise<`0x${string}`> {
        return this.account.address;
    }

    public async signMessage(hash: `0x${string}`): Promise<`0x${string}`> {
        return this.account.signMessage({
            message: { raw: hash }
        });
    }

    public getViemAccount(): LocalAccount {
        return {
            address: this.account.address,
            publicKey: this.account.publicKey,
            source: "custom-signer",
            type: "local",
            signMessage: async ({ message }) => {
                return this.account.signMessage({ message });
            },
            signTransaction: async (transaction, serializer) => {
                return this.account.signTransaction(transaction, serializer);
            },
            signTypedData: async (typedData) => {
                return this.account.signTypedData(typedData);
            }
        } as LocalAccount;
    }
}
export default LocalSigner;
