import mongoose, {Document, Schema} from 'mongoose';

export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface ITransaction extends Document {
    userId: string;
    accountId: string;
    hash: string;
    userOpHash: string;
    to?: string;
    value?: string;
    data?: string;
    bundlerID?: string;
    paymasterID?: string;
    walletID?: string;
    gasUsed?: string;
    status: TransactionStatus;
    chainId: number;
    createdAt: Date;
    updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
    userId: {
        type: String,
        required: true
    },
    accountId: {
        type: String,
        required: true
    },
    hash: {
        type: String,
        required: true
    },
    userOpHash: {
        type: String,
        required: true
    },
    to: {
        type: String,
        required: false
    },
    value: {
        type: String,
        required: false,
        default: '0'
    },
    data: {
        type: String,
        required: false
    },
    bundlerID: {
        type: String,
        required: false
    },
    paymasterID: {
        type: String,
        required: false
    },
    walletID: {
        type: String,
        required: false
    },
    gasUsed: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'failed'],
        default: 'pending'
    },
    chainId: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

transactionSchema.set('toJSON', {
    transform: function (_doc, ret) {
        ret.id = ret._id;
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
    }
});

export const TransactionModel = mongoose.model<ITransaction>('Transaction', transactionSchema);
