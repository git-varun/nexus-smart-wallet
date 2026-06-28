import mongoose, {Document, Schema} from 'mongoose';

export interface ISessionPermission {
    target: string;
    allowedFunctions: string[];
    spendingLimit: string;
}

export interface ISessionKey extends Document {
    userId: string;
    ownerAddress: string; // Smart Account address
    publicKey: string; // The session key public address
    chainId: number;
    permissions: ISessionPermission[];
    expiresAt: Date;
    isActive: boolean;
    revokedAt?: Date;
    signature?: string;
    createdAt: Date;
    updatedAt: Date;
}

const sessionPermissionSchema = new Schema<ISessionPermission>({
    target: { type: String, required: true, lowercase: true },
    allowedFunctions: [{ type: String, required: true }],
    spendingLimit: { type: String, required: true, default: '0' }
});

const sessionKeySchema = new Schema<ISessionKey>({
    userId: { type: String, required: true },
    ownerAddress: { type: String, required: true, lowercase: true },
    publicKey: { type: String, required: true, lowercase: true },
    chainId: { type: Number, required: true },
    permissions: [sessionPermissionSchema],
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    revokedAt: { type: Date },
    signature: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Database indexes
sessionKeySchema.index({ ownerAddress: 1, chainId: 1 });
sessionKeySchema.index({ publicKey: 1 }, { unique: true });
sessionKeySchema.index({ userId: 1 });
sessionKeySchema.index({ userId: 1, ownerAddress: 1, chainId: 1 });

sessionKeySchema.set('toJSON', {
    transform: function (_doc, ret) {
        ret.id = ret._id?.toString();
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
    }
});

export const SessionKeyModel = mongoose.model<ISessionKey>('SessionKey', sessionKeySchema);
export default SessionKeyModel;
