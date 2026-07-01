import mongoose, {Document, Schema} from 'mongoose';

export type TransactionStatus = 'pending' | 'queued' | 'processing' | 'submitted' | 'confirmed' | 'failed' | 'retrying' | 'cancelled';

export interface ITransaction extends Document {
    userId: string;
    accountId: string;
    hash?: string;
    userOpHash?: string;
    to?: string;
    value?: string;
    data?: string;
    bundlerID?: string;
    paymasterID?: string;
    walletID?: string;
    gasUsed?: string;
    status: TransactionStatus;
    chainId: number;
    queuedAt?: Date;
    startedAt?: Date;
    submittedAt?: Date;
    confirmedAt?: Date;
    completedAt?: Date;
    executionDuration?: number;
    queueDuration?: number;
    blockchainDuration?: number;
    retryCount: number;
    failureReason?: string;
    workerId?: string;
    requestId?: string;
    rpcEndpoint?: string;
    idempotencyKey?: string;
    sessionKeyAddress?: string;
    calls?: {
        to: string;
        value: string;
        data: string;
    }[];
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
        required: false
    },
    userOpHash: {
        type: String,
        required: false
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
        enum: ['pending', 'queued', 'processing', 'submitted', 'confirmed', 'failed', 'retrying', 'cancelled'],
        default: 'pending'
    },
    chainId: {
        type: Number,
        required: true
    },
    queuedAt: {
        type: Date
    },
    startedAt: {
        type: Date
    },
    submittedAt: {
        type: Date
    },
    confirmedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    executionDuration: {
        type: Number
    },
    queueDuration: {
        type: Number
    },
    blockchainDuration: {
        type: Number
    },
    retryCount: {
        type: Number,
        default: 0
    },
    failureReason: {
        type: String
    },
    workerId: {
        type: String
    },
    requestId: {
        type: String,
        required: false
    },
    rpcEndpoint: {
        type: String
    },
    idempotencyKey: {
        type: String,
        unique: true,
        sparse: true
    },
    sessionKeyAddress: {
        type: String,
        required: false,
        lowercase: true
    },
    calls: {
        type: [{
            to: { type: String, required: true, lowercase: true },
            value: { type: String, default: '0' },
            data: { type: String, default: '0x' }
        }],
        required: false
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

// Database indexes for query optimization and worker reliability
transactionSchema.index({ userId: 1, chainId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: 1 });
transactionSchema.index({ hash: 1 }, { unique: true, sparse: true });
transactionSchema.index({ userOpHash: 1 }, { unique: true, sparse: true });
transactionSchema.index({ status: 1, chainId: 1, accountId: 1 });

transactionSchema.set('toJSON', {
    transform: function (_doc, ret) {
        ret.id = ret._id;
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
    }
});

export const TransactionModel = mongoose.model<ITransaction>('Transaction', transactionSchema);
