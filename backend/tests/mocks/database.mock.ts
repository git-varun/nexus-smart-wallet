import { ITransaction, IAccount } from "../../src/models";

export const mockTransactionModel = {
    save: jest.fn().mockResolvedValue({}),
    findOneAndUpdate: jest.fn(),
    updateOne: jest.fn(),
};

export const mockAccountModel = {
    save: jest.fn().mockResolvedValue({}),
};

export const mockTransactionRepository = {
    createTransaction: jest.fn().mockImplementation((data) => Promise.resolve({
        id: "tx-123",
        status: "queued",
        createdAt: new Date(),
        updatedAt: new Date(),
        retryCount: 0,
        ...data,
        save: jest.fn().mockResolvedValue(true),
    } as unknown as ITransaction)),
    findTransactionByIdempotencyKey: jest.fn().mockResolvedValue(null),
    findTransactionByHash: jest.fn().mockResolvedValue(null),
    findTransactionsByUserId: jest.fn().mockResolvedValue([]),
};

export const mockAccountRepository = {
    createAccount: jest.fn(),
    findAccountByAddress: jest.fn(),
    updateAccount: jest.fn(),
};
