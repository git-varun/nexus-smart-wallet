import {accountRepository} from '../repositories';
import {updateAccount} from '../repositories/accountRepository';
import {createServiceLogger} from '../utils';
import {IAccount, AccountModel} from "../models";
import {SUPPORTED_WALLETS} from "../config/config";
import {getAccount} from "../scripts/permissionless";
import {rpcProvider} from "./provider.service";

const logger = createServiceLogger('Wallet');

export async function createUserAccount(
    userId: string,
    chainId: number,
    walletID: string,
    accountType: string
): Promise<{ success: boolean, account?: IAccount, alreadyExists?: boolean, error?: Error | string }> {
    try {

        logger.debug('Creating new account', {userId, chainId, walletID, accountType});

        if (!SUPPORTED_WALLETS.includes(walletID)) {
            return {
                success: false,
                error: `An unsupported provider: ${walletID}. Currently only ALCHEMY, SAFE is supported.`
            };
        }

        const account = await getAccount(walletID, {
            userId,
            chainId,
            walletID,
            accountType,
            isDeployed: false,
            isActive: false,
        } as any);
        const factoryInfo = await account.getFactoryArgs();
        const result = await accountRepository.findOrCreateAccount(
            {userId, chainId, walletID, accountType},
            {
                userId,
                address: account.address,
                chainId,
                isDeployed: false,
                isActive: false,
                signerAddress: "CENTRAL_WALLET",
                accountType,
                walletID,
                providerInfo: {
                    factory: factoryInfo?.factory,
                    factoryData: factoryInfo?.factoryData
                }
            }
        );

        if (result.created) {
            logger.info('Wallet created');
            logger.debug('Wallet created details', { account: result.account });
            return {
                success: true,
                account: result.account,
                alreadyExists: false,
            };
        }

        logger.info('Wallet create request matched existing account', {userId, chainId, walletID, accountType});
        return {
            success: true,
            account: result.account,
            alreadyExists: true,
        };

    } catch (error: any) {
        if (error?.code === 11000) {
            const accounts = await accountRepository.findBy({userId, chainId, walletID, accountType});
            if (accounts.length > 0) {
                logger.info('Recovered duplicate account create race from unique index', {
                    userId,
                    chainId,
                    walletID,
                    accountType
                });
                return {
                    success: true,
                    account: accounts[0],
                    alreadyExists: true,
                };
            }

            logger.error('Account unique index conflict could not be resolved', error);
            return {
                success: false,
                error: 'Account uniqueness conflict could not be resolved'
            };
        }

        if (error?.message?.includes('already exists')) {
            logger.warn('Account already exists in Alchemy, but not in our database', {
                userId,
                chainId,
                error: error?.message
            });

            return {
                success: false,
                error: 'Account already exists in Alchemy but not found in a local database. Please contact support.'
            };
        }

        logger.error('Failed to get or create account', error instanceof Error ? error : new Error(String(error)));
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create account'
        };
    }
}

export async function getUserAccount(userId: string, chainId: number, walletID: string): Promise<{
    success: boolean;
    account?: IAccount;
    error?: string;
}> {
    try {
        logger.info('Starting account lookup', {userId, chainId});

        const chainAccount = await accountRepository.findBy({
            userId,
            chainId,
            walletID
        });

        if (!chainAccount.length) {
            return {
                success: false,
                error: 'No account found for user'
            };
        }

        logger.info('Account info retrieved', {
            userId,
            address: chainAccount[0].address,
        });

        return {
            success: true,
            account: chainAccount[0]
        };

    } catch (error) {
        logger.error('Failed to get account info', error instanceof Error ? error : new Error(String(error)));
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get account info'
        };
    }
}

export async function getUserAccounts(userId: string, chainId: number): Promise<{
    success: boolean;
    accounts?: IAccount[];
    error?: string;
}> {
    try {
        logger.info('Starting accounts lookup', {userId, chainId});

        const chainAccounts = await accountRepository.findBy({userId, chainId});

        logger.info('Accounts retrieved', {
            userId,
            chainId,
            count: chainAccounts.length
        });

        return {
            success: true,
            accounts: chainAccounts
        };

    } catch (error) {
        logger.error('Failed to get user accounts', error instanceof Error ? error : new Error(String(error)));
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get user accounts'
        };
    }
}

export async function getAccountDetails(address: string, chainId: number): Promise<{
    success: boolean;
    account?: IAccount;
    error?: string;
}> {
    try {
        const account = await accountRepository.findAccountByAddress(address);
        if (!account) {
            return {
                success: false,
                error: 'Account not found'
            };
        }

        if (account.chainId !== chainId) {
            return {
                success: false,
                error: `Account found but on a different chain. Expected: ${chainId}, Found: ${account.chainId}`
            };
        }

        logger.info('Account details retrieved', {address, chainId});

        return {
            success: true,
            account
        };

    } catch (error) {
        logger.error('Failed to get account details', error instanceof Error ? error : new Error(String(error)));
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get account details'
        };
    }
}

export async function reconcileAllAccountsDeploymentStatus(): Promise<void> {
    try {
        const undeployedAccounts = await AccountModel.find({ isDeployed: false });
        if (undeployedAccounts.length === 0) return;

        logger.info(`Starting background deployment reconciliation for ${undeployedAccounts.length} accounts...`);
        for (const account of undeployedAccounts) {
            try {
                const client = rpcProvider.getPublicClient(account.chainId);
                const bytecode = await client.getBytecode({ address: account.address as `0x${string}` });
                if (bytecode && bytecode !== '0x') {
                    logger.info(`Reconciling account ${account.address} deployment status to true (found bytecode on-chain)`);
                    await updateAccount(account.id, {
                        isDeployed: true,
                        isActive: true
                    });
                }
            } catch (err) {
                logger.error(`Failed to reconcile deployment status for account ${account.address} on chain ${account.chainId}`, err as Error);
            }
        }
    } catch (error) {
        logger.error('Failed running background accounts deployment reconciliation', error as Error);
    }
}
