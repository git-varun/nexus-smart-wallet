import {config} from "../config/config";
import {createPublicClient, hexToBytes, http, keccak256, toBytes,} from "viem";
import {privateKeyToAccount} from "viem/accounts";
import {ALCHEMY_CHAIN_MAP} from "../config/chain";

export async function signMessage(hash: `0x${string}`) {
    const privateKey = config.centralWallet.privateKey as `0x${string}`
    if (isValidPrivateKey(privateKey)) {
        const account = privateKeyToAccount(privateKey);
        const messageBytes = hexToBytes(hash);
        return await account.signMessage({
            message: {raw: messageBytes}  // ensures Viem treats as raw binary data
        });
    }
    throw new Error('Not a valid private key.');
}

export function getRPC_URL(chainId: string | number, provider?: string) {
    console.log(`getRPC_URL: ${chainId}, provider: ${provider}`);
    if (provider === "PIMLICO") return `https://api.pimlico.io/v2/${chainId}/rpc?apikey=pim_jMrxojGCj1SHLGpiJ5oJ5u`;
    if (provider === "ALCHEMY" || !provider) return `https://${ALCHEMY_CHAIN_MAP[Number(chainId) as keyof typeof ALCHEMY_CHAIN_MAP]}.g.alchemy.com/v2/${config.alchemy.apiKey}`;
    return `https://${provider}${chainId}`;
}

export async function getCentralAccount() {
    const centralWalletPrivateKey = config.centralWallet.privateKey as `0x${string}`;
    return privateKeyToAccount(centralWalletPrivateKey);
}

export async function getCentralAddress() {
    const account = await getCentralAccount();
    return account.address;
}

export async function getCentralWalletNonce(chainId: number) {
    const rpc = getRPC_URL(chainId);
    const address = await getCentralAddress();
    const client = createPublicClient({transport: http(rpc)});
    return client.getTransactionCount({address});
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


