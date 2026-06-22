import { Address, formatUnits } from "viem";
import { PortfolioModel, IPortfolio, IPortfolioAsset } from "../models";
import { rpcProvider } from "./provider.service";
import { config } from "../config/config";
import { ALCHEMY_CHAIN_MAP } from "../config/chain";
import { createServiceLogger } from "../utils";

const logger = createServiceLogger("PortfolioService");

// Standard ERC20 Minimal ABI for metadata queries
const ERC20_MINIMAL_ABI = [
    {
        name: "symbol",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ type: "string" }]
    },
    {
        name: "name",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ type: "string" }]
    },
    {
        name: "decimals",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ type: "uint8" }]
    },
    {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ type: "address", name: "owner" }],
        outputs: [{ type: "uint256" }]
    }
] as const;

// Known ERC-20 tokens per chain as fallback
const KNOWN_TOKENS: Record<number, { address: string; symbol: string; name: string; decimals: number }[]> = {
    11155111: [ // Sepolia
        { address: "0x94a9D252C073822190878e53d48DA314b301BEA8", symbol: "USDC", name: "USD Coin", decimals: 6 },
        { address: "0xaA8E23Fb1079EA71e0a56F48a2AA51851D8433D0", symbol: "USDT", name: "Tether USD", decimals: 6 },
        { address: "0xfFf9976782d46CC05630D1f6eBFA35EC05587e53", symbol: "WETH", name: "Wrapped Ether", decimals: 18 }
    ],
    84532: [ // Base Sepolia
        { address: "0x036cbd53842c5426634e7929541ec2318f8d62e2", symbol: "USDC", name: "USD Coin", decimals: 6 },
        { address: "0x4200000000000000000000000000000000000006", symbol: "WETH", name: "Wrapped Ether", decimals: 18 }
    ]
};

/**
 * Fetches token metadata (decimals, symbol, name) via RPC.
 */
async function fetchERC20Metadata(client: any, tokenAddress: `0x${string}`) {
    try {
        const [symbol, name, decimals] = await Promise.all([
            client.readContract({
                address: tokenAddress,
                abi: ERC20_MINIMAL_ABI,
                functionName: "symbol"
            }).catch(() => "UNKNOWN"),
            client.readContract({
                address: tokenAddress,
                abi: ERC20_MINIMAL_ABI,
                functionName: "name"
            }).catch(() => "Unknown Token"),
            client.readContract({
                address: tokenAddress,
                abi: ERC20_MINIMAL_ABI,
                functionName: "decimals"
            }).catch(() => 18)
        ]);

        return { symbol, name, decimals };
    } catch (err) {
        logger.error(`Error querying ERC20 metadata for ${tokenAddress}`, err as Error);
        return { symbol: "UNKNOWN", name: "Unknown Token", decimals: 18 };
    }
}

/**
 * Synchronizes the smart account portfolio (native, ERC-20, NFTs) from on-chain state and API endpoints.
 */
export async function syncPortfolio(userId: string, address: string, chainId: number): Promise<IPortfolio> {
    logger.info("Synchronizing portfolio", { userId, address, chainId });
    const checksummedAddress = address.toLowerCase();

    try {
        const client = rpcProvider.getPublicClient(chainId);
        const assets: IPortfolioAsset[] = [];

        // 1. Fetch Native Balance (ETH/native token)
        try {
            const nativeBal = await client.getBalance({ address: checksummedAddress as Address });
            assets.push({
                type: "native",
                symbol: chainId === 56 || chainId === 97 ? "BNB" : "ETH",
                name: chainId === 56 || chainId === 97 ? "Binance Coin" : "Ethereum",
                decimals: 18,
                balance: nativeBal.toString(),
                metadata: {}
            });
        } catch (err) {
            logger.error(`Failed fetching native balance for ${checksummedAddress}`, err as Error);
        }

        // 2. Fetch ERC-20 Token Balances
        let erc20Fetched = false;
        const network = ALCHEMY_CHAIN_MAP[chainId as keyof typeof ALCHEMY_CHAIN_MAP];

        if (network && config.alchemy.apiKey) {
            try {
                const url = `https://${network}.g.alchemy.com/v2/${config.alchemy.apiKey}`;
                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        jsonrpc: "2.0",
                        method: "alchemy_getTokenBalances",
                        params: [checksummedAddress],
                        id: 1
                    })
                });
                const json: any = await response.json();
                if (json?.result?.tokenBalances) {
                    const balances = json.result.tokenBalances;
                    for (const tb of balances) {
                        const tokenAddress = tb.contractAddress.toLowerCase();
                        const rawBalance = BigInt(tb.tokenBalance);
                        if (rawBalance > 0n) {
                            // Query metadata
                            const meta = await fetchERC20Metadata(client, tokenAddress as `0x${string}`);
                            assets.push({
                                type: "erc20",
                                tokenAddress,
                                symbol: meta.symbol,
                                name: meta.name,
                                decimals: meta.decimals,
                                balance: rawBalance.toString()
                            });
                        }
                    }
                    erc20Fetched = true;
                }
            } catch (err) {
                logger.error(`Alchemy token balances API failed for ${checksummedAddress}, falling back to manual list`, err as Error);
            }
        }

        // Manual Fallback: if Alchemy isn't configured/failed, query known tokens
        if (!erc20Fetched) {
            const tokens = KNOWN_TOKENS[chainId] || [];
            for (const token of tokens) {
                try {
                    const bal = await client.readContract({
                        address: token.address as Address,
                        abi: ERC20_MINIMAL_ABI,
                        functionName: "balanceOf",
                        args: [checksummedAddress as Address]
                    });
                    if (bal > 0n) {
                        assets.push({
                            type: "erc20",
                            tokenAddress: token.address.toLowerCase(),
                            symbol: token.symbol,
                            name: token.name,
                            decimals: token.decimals,
                            balance: bal.toString()
                        });
                    }
                } catch (err) {
                    // Ignore failures for specific fallback tokens (contract might not exist on custom fork)
                }
            }
        }

        // 3. Fetch NFT (ERC-721 / ERC-1155) Balances
        if (network && config.alchemy.apiKey) {
            try {
                const url = `https://${network}.g.alchemy.com/nft/v3/${config.alchemy.apiKey}/getNFTsForOwner?owner=${checksummedAddress}&withMetadata=true`;
                const response = await fetch(url);
                const json: any = await response.json();
                if (json?.ownedNfts) {
                    for (const nft of json.ownedNfts) {
                        const type = nft.tokenType?.toLowerCase() === "erc1155" ? "erc1155" : "erc721";
                        assets.push({
                            type,
                            tokenAddress: nft.contractAddress.toLowerCase(),
                            tokenId: nft.tokenId,
                            symbol: nft.contractMetadata?.symbol || nft.symbol || "",
                            name: nft.name || nft.contractMetadata?.name || "NFT Asset",
                            balance: nft.balance || "1",
                            metadata: {
                                image: nft.image?.cachedUrl || nft.image?.thumbnailUrl || nft.image?.originalUrl || "",
                                description: nft.description || "",
                                properties: nft.properties || []
                            }
                        });
                    }
                }
            } catch (err) {
                logger.error(`Alchemy NFT balances API failed for ${checksummedAddress}`, err as Error);
            }
        }

        // Upsert the portfolio details in the database
        const portfolio = await PortfolioModel.findOneAndUpdate(
            { address: checksummedAddress, chainId },
            {
                userId,
                address: checksummedAddress,
                chainId,
                assets,
                lastSyncedAt: new Date()
            },
            { upsert: true, new: true }
        );

        logger.info("Portfolio synced successfully", { address: checksummedAddress, chainId, assetCount: assets.length });
        return portfolio;
    } catch (error) {
        logger.error("Failed to sync portfolio", error instanceof Error ? error : new Error(String(error)));
        throw error;
    }
}

/**
 * Returns the cached portfolio from database, or triggers sync if not present.
 */
export async function getPortfolio(userId: string, address: string, chainId: number): Promise<IPortfolio> {
    const checksummedAddress = address.toLowerCase();
    const portfolio = await PortfolioModel.findOne({ address: checksummedAddress, chainId });
    if (!portfolio) {
        return await syncPortfolio(userId, address, chainId);
    }
    return portfolio;
}

/**
 * Background synchronization routine.
 * Finds all portfolios that have not been synced in the last 15 minutes and reconciles them.
 */
export async function runBackgroundPortfolioSync(): Promise<void> {
    try {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const stalePortfolios = await PortfolioModel.find({
            lastSyncedAt: { $lt: fifteenMinutesAgo }
        });

        if (stalePortfolios.length === 0) return;

        logger.info(`Starting background portfolio sync for ${stalePortfolios.length} accounts...`);
        for (const p of stalePortfolios) {
            try {
                await syncPortfolio(p.userId, p.address, p.chainId);
            } catch (err) {
                logger.error(`Failed to background sync portfolio for address ${p.address} on chain ${p.chainId}`, err as Error);
            }
        }
    } catch (error) {
        logger.error("Failed background portfolio sync execution", error as Error);
    }
}
