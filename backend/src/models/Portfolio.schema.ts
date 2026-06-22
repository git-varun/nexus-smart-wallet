import mongoose, {Document, Schema} from 'mongoose';

export interface IPortfolioAsset {
    type: 'native' | 'erc20' | 'erc721' | 'erc1155';
    tokenAddress?: string;
    tokenId?: string;
    symbol?: string;
    name?: string;
    decimals?: number;
    balance: string;
    metadata?: Record<string, any>;
}

export interface IPortfolio extends Document {
    userId: string;
    address: string;
    chainId: number;
    assets: IPortfolioAsset[];
    lastSyncedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const portfolioAssetSchema = new Schema<IPortfolioAsset>({
    type: {
        type: String,
        enum: ['native', 'erc20', 'erc721', 'erc1155'],
        required: true
    },
    tokenAddress: {
        type: String,
        lowercase: true,
        default: null
    },
    tokenId: {
        type: String,
        default: null
    },
    symbol: {
        type: String,
        default: ''
    },
    name: {
        type: String,
        default: ''
    },
    decimals: {
        type: Number,
        default: 18
    },
    balance: {
        type: String,
        required: true,
        default: '0'
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    }
});

const portfolioSchema = new Schema<IPortfolio>({
    userId: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true,
        lowercase: true
    },
    chainId: {
        type: Number,
        required: true
    },
    assets: {
        type: [portfolioAssetSchema],
        default: []
    },
    lastSyncedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for fast querying and uniqueness per account + chain
portfolioSchema.index({ address: 1, chainId: 1 }, { unique: true });
portfolioSchema.index({ userId: 1 });

portfolioSchema.set('toJSON', {
    transform: function (_doc, ret) {
        ret.id = ret._id?.toString();
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
    }
});

export const PortfolioModel = mongoose.model<IPortfolio>('Portfolio', portfolioSchema);
