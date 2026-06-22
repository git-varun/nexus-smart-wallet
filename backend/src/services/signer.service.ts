import { config } from "../config/config";
import { ISigner } from "./signer/signer.interface";
import { LocalSigner } from "./signer/local.signer";

// Composition Root: Instantiate and configure implementation based on environment
const privateKey = config.centralWallet.privateKey;
if (!privateKey) {
    throw new Error("MASTER_WALLET_PRIVATE_KEY is missing from configuration.");
}

export const custodialSigner: ISigner = new LocalSigner(privateKey);
export default custodialSigner;
export * from "./signer/signer.interface";
