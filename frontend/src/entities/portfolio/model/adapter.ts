// src/entities/portfolio/model/adapter.ts
import { PortfolioAssetDto, PortfolioDto } from '@/shared/api/contracts';

export interface AssetMetadata {
    image?: string;
    description?: string;
    [key: string]: unknown;
}

export interface Asset {
    type: 'native' | 'erc20' | 'erc721' | 'erc1155';
    tokenAddress: string;
    tokenId?: string;
    symbol: string;
    name: string;
    decimals: number;
    balance: string;
    metadata: AssetMetadata;
    priceUsd?: number;
    valueUsd?: number;
}

export interface Portfolio {
    assets: Asset[];
    totalValueUsd: number;
}

const STATIC_PRICES: Record<string, number> = {
    'ETH': 3200,
    'WETH': 3200,
    'USDC': 1,
    'USDT': 1,
    'BNB': 600,
    'MATIC': 0.70
};

export function toAsset(dto: PortfolioAssetDto): Asset {
    const type = dto.type || 'erc20';
    const symbol = dto.symbol || 'UNKNOWN';
    const decimals = dto.decimals || 18;
    const balance = dto.balance || '0';
    
    const priceUsd = STATIC_PRICES[symbol.toUpperCase()] || 0;
    
    let valueUsd = 0;
    if (type === 'native' || type === 'erc20') {
        try {
            const rawBalance = BigInt(balance);
            const formattedBalance = Number(rawBalance) / Math.pow(10, decimals);
            valueUsd = formattedBalance * priceUsd;
        } catch {
            try {
                const formattedBalance = parseFloat(balance);
                if (isNaN(formattedBalance)) {
                    throw new Error(`Invalid balance format: ${balance}`);
                }
                valueUsd = formattedBalance * priceUsd;
            } catch (error) {
                throw new Error(`Failed to parse balance for asset ${symbol}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }
    
    const rawMetadata = dto.metadata || {};
    const metadata: AssetMetadata = {
        ...rawMetadata,
        image: typeof rawMetadata.image === 'string' ? rawMetadata.image : undefined,
        description: typeof rawMetadata.description === 'string' ? rawMetadata.description : undefined,
    };

    return {
        type,
        tokenAddress: dto.tokenAddress || '0x0000000000000000000000000000000000000000',
        tokenId: dto.tokenId ?? undefined,
        symbol,
        name: dto.name || 'Unknown Token',
        decimals,
        balance,
        metadata,
        priceUsd,
        valueUsd
    };
}

export function toPortfolio(dto: PortfolioDto): Portfolio {
    const assets = dto.assets.map(toAsset);
    
    const totalValueUsd = assets.reduce((sum: number, asset: Asset) => sum + (asset.valueUsd || 0), 0);
    
    return {
        assets,
        totalValueUsd,
    };
}
