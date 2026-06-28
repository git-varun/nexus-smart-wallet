// src/entities/portfolio/model/adapter.ts

export interface Asset {
    type: 'native' | 'erc20' | 'erc721' | 'erc1155';
    tokenAddress: string;
    tokenId?: string;
    symbol: string;
    name: string;
    decimals: number;
    balance: string;
    metadata: Record<string, any>;
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

export function toAsset(dto: any): Asset {
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
                valueUsd = isNaN(formattedBalance) ? 0 : formattedBalance * priceUsd;
            } catch {
                valueUsd = 0;
            }
        }
    }
    
    return {
        type,
        tokenAddress: dto.tokenAddress || '0x0000000000000000000000000000000000000000',
        tokenId: dto.tokenId,
        symbol,
        name: dto.name || 'Unknown Token',
        decimals,
        balance,
        metadata: dto.metadata || {},
        priceUsd,
        valueUsd
    };
}

export function toPortfolio(dto: any): Portfolio {
    const assetsData = dto.portfolio?.assets || dto.assets || [];
    const assets = assetsData.map(toAsset);
    
    const totalValueUsd = assets.reduce((sum: number, asset: Asset) => sum + (asset.valueUsd || 0), 0);
    
    return {
        assets,
        totalValueUsd,
    };
}
