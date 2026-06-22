import mongoose, {Document, Schema} from 'mongoose';

export interface INonce extends Document {
    signerAddress: string;
    chainId: number;
    nonce: number;
    updatedAt: Date;
}

const nonceSchema = new Schema<INonce>({
    signerAddress: {
        type: String,
        required: true,
        lowercase: true
    },
    chainId: {
        type: Number,
        required: true
    },
    nonce: {
        type: Number,
        required: true,
        default: 0
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound unique index to serialize submissions per chain per custodial EOA signer
nonceSchema.index({ signerAddress: 1, chainId: 1 }, { unique: true });

export const NonceModel = mongoose.model<INonce>('Nonce', nonceSchema);
