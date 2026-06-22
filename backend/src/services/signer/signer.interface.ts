import { LocalAccount } from "viem";

export interface ISigner {
    getAddress(): Promise<`0x${string}`>;
    signMessage(hash: `0x${string}`): Promise<`0x${string}`>;
    getViemAccount(): LocalAccount;
}
