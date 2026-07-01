import {AccountModel, IAccount} from '../models';

export type CreateAccountResult = {
    account: IAccount;
    created: boolean;
};

export async function createAccount(data: Partial<IAccount>): Promise<IAccount> {
    const account = new AccountModel(data);
    return await account.save();
}

export async function findOrCreateAccount(
    query: {
        userId: string;
        chainId: number;
        walletID: string;
        accountType: string;
    },
    data: Partial<IAccount>
): Promise<CreateAccountResult> {
    const result = await AccountModel.findOneAndUpdate(
        query,
        {
            $setOnInsert: {
                ...data,
                address: data.address?.toLowerCase(),
            }
        },
        {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
            includeResultMetadata: true,
        }
    );

    if (!result.value) {
        throw new Error('Failed to create or load account');
    }

    return {
        account: result.value,
        created: !result.lastErrorObject?.updatedExisting,
    };
}

export async function findAccountById(id: string): Promise<IAccount | null> {
    return AccountModel.findById(id);
}

export async function findAccountByAddress(address: string): Promise<IAccount | null> {
    return AccountModel.findOne({address: address.toLowerCase()});
}

export async function findAccountsByUserId(userId: string): Promise<IAccount[]> {
    return AccountModel.find({userId});
}

export async function updateAccount(id: string, data: any): Promise<IAccount | null> {
    return AccountModel.findByIdAndUpdate(id, data, {new: true});
}

export async function findBy(query: {
    userId: string,
    chainId: number,
    walletID?: string,
    accountType?: string
}): Promise<IAccount[]> {
    return AccountModel.find(query);
}

export async function deleteAccount(id: string): Promise<boolean> {
    const result = await AccountModel.findByIdAndDelete(id);
    return !!result;
}

export async function findAllAccounts(): Promise<IAccount[]> {
    return AccountModel.find({});
}
