import {ITransaction, TransactionModel, TransactionStatus} from '../models';

export async function createTransaction(data: Partial<ITransaction>): Promise<ITransaction> {
    const transaction = new TransactionModel(data);
    return await transaction.save();
}

export async function findTransactionByUserOpHash(userOpHash: string): Promise<ITransaction | null> {
    return TransactionModel.findOne({userOpHash});
}

export async function findTransactionById(id: string): Promise<ITransaction | null> {
    return TransactionModel.findById(id);
}

export async function findTransactionByHash(hash: string): Promise<ITransaction | null> {
    return TransactionModel.findOne({hash});
}

export async function findTransactionsByUserId(userId: string, chainId?: number): Promise<ITransaction[]> {
    const query = chainId !== undefined ? {userId, chainId} : {userId};
    return TransactionModel.find(query).sort({createdAt: -1});
}

export async function findTransactionsByAccountId(accountId: string): Promise<ITransaction[]> {
    return TransactionModel.find({accountId}).sort({createdAt: -1});
}

export async function updateTransaction(id: string, data: any): Promise<ITransaction | null> {
    return TransactionModel.findByIdAndUpdate(id, data, {new: true});
}

export async function deleteTransaction(id: string): Promise<boolean> {
    const result = await TransactionModel.findByIdAndDelete(id);
    return !!result;
}

export async function findAllTransactions(): Promise<ITransaction[]> {
    return TransactionModel.find({}).sort({createdAt: -1});
}

export async function findTransactionByIdempotencyKey(idempotencyKey: string): Promise<ITransaction | null> {
    return TransactionModel.findOne({ idempotencyKey });
}

export interface TransactionQueryFilters {
    chainId?: number;
    status?: string;
    search?: string;
    to?: string;
    paymasterID?: string;
    bundlerID?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export async function findTransactionsWithFilters(
    userId: string,
    filters: TransactionQueryFilters
): Promise<{ transactions: ITransaction[]; totalCount: number; page: number; limit: number }> {
    const query: any = { userId };

    if (filters.chainId !== undefined) {
        query.chainId = filters.chainId;
    }
    if (filters.status) {
        query.status = filters.status;
    }
    if (filters.to) {
        query.to = { $regex: new RegExp(filters.to, 'i') };
    }
    if (filters.paymasterID) {
        query.paymasterID = filters.paymasterID;
    }
    if (filters.bundlerID) {
        query.bundlerID = filters.bundlerID;
    }
    if (filters.search) {
        const searchRegex = new RegExp(filters.search, 'i');
        query.$or = [
            { hash: { $regex: searchRegex } },
            { userOpHash: { $regex: searchRegex } },
            { to: { $regex: searchRegex } },
            { failureReason: { $regex: searchRegex } }
        ];
    }

    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(100, filters.limit || 10));
    const skip = (page - 1) * limit;

    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
    const sort: any = {};
    sort[sortBy] = sortOrder;

    const totalCount = await TransactionModel.countDocuments(query);
    const transactions = await TransactionModel.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit);

    return {
        transactions,
        totalCount,
        page,
        limit
    };
}


