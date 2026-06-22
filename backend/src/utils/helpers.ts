import {config} from "../config/config";
import {keccak256, toBytes} from "viem";
import {ALCHEMY_CHAIN_MAP} from "../config/chain";
import {custodialSigner} from "../services/signer.service";
import {rpcProvider} from "../services/provider.service";

export async function signMessage(hash: `0x${string}`) {
    return custodialSigner.signMessage(hash);
}

export function getRPC_URL(chainId: string | number, provider?: string) {
    console.log(`getRPC_URL: ${chainId}, provider: ${provider}`);
    if (provider === "PIMLICO") return `https://api.pimlico.io/v2/${chainId}/rpc?apikey=${config.pimlico.apiKey}`;
    if (provider === "ALCHEMY" || !provider) return `https://${ALCHEMY_CHAIN_MAP[Number(chainId) as keyof typeof ALCHEMY_CHAIN_MAP]}.g.alchemy.com/v2/${config.alchemy.apiKey}`;
    return `https://${provider}${chainId}`;
}

export async function getCentralAccount() {
    return custodialSigner.getViemAccount();
}

export async function getCentralAddress() {
    return custodialSigner.getAddress();
}

export async function getCentralWalletNonce(chainId: number) {
    const address = await getCentralAddress();
    return rpcProvider.getTransactionCount(address, chainId);
}

// ==================== CRYPTOGRAPHIC UTILITIES ====================

/**
 * Generate deterministic salt from user data
 */
export const generateSalt = (userId: string, chainId: number): string => {
    const saltBuffer = keccak256(toBytes(userId + chainId.toString()));
    return saltBuffer.slice(0, 10); // Use first 8 bytes + 0x prefix = 10 chars
};

// ==================== TYPE GUARDS ====================

/**
 * Check if a value is a valid hex string
 */
export const isHexString = (value: string): value is `0x${string}` => {
    return /^0x[0-9a-fA-F]*$/.test(value);
};

/**
 * Check if a value is a valid private key
 */
export const isValidPrivateKey = (privateKey: string): privateKey is `0x${string}` => {
    return isHexString(privateKey) && privateKey.length === 66; // 0x + 64 hex chars
};
