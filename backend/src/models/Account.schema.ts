import mongoose, {Document, Schema} from 'mongoose';

export type ProviderInfo = { [key: string]: any } | Map<string, any>;

export interface IAccount extends Document {
    userId: string;
    address: string;
    chainId: number;
    isDeployed: boolean;
    signerAddress: string;
    providerInfo?: ProviderInfo;
    accountType: string;
    walletID: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const accountSchema = new Schema<IAccount>({
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
        required: true,
        default: 84532
    },
    isDeployed: {
        type: Boolean,
        default: false
    },
    signerAddress: {
        type: String,
        default: null
    },
    accountType: {
        type: String,
        default: null
    },
    walletID: {
        type: String,
        default: null
    },
    providerInfo: {
        type: Map,
        of: Schema.Types.Mixed,
        default: {}
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: {createdAt: 'createdAt', updatedAt: 'updatedAt'}
});

// Database indexes for query optimization
accountSchema.index({ address: 1 });
accountSchema.index({ userId: 1, chainId: 1 });
accountSchema.index({ address: 1, chainId: 1 }, { unique: true });

accountSchema.set('toJSON', {
    transform: function (_doc, ret) {
        ret.id = ret._id?.toString();
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
    }
});

export const AccountModel = mongoose.model<IAccount>('Account', accountSchema);
