import {Response, NextFunction} from 'express';
import {AuthenticatedRequest, getUserId} from '../middleware';
import {createUserAccount, getAccountDetails, getUserAccounts} from '../services/account.service';
import {createServiceLogger} from '../utils';

const logger = createServiceLogger('Wallet');

export async function createSmartAccount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = getUserId(req);
        const {chainId, walletID, accountType} = req.body;

        // Validate UserId
        if (!userId) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'User authentication required'
                }
            });
            return;
        }

        // Validate chainId
        if (chainId <= 0) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_CHAIN_ID',
                    message: 'Valid chain ID is required'
                }
            });
            return;
        }

        // Validate WalletID
        if (!walletID) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_WALLET_TYPE',
                    message: 'Valid wallet type is required'
                }
            });
            return;
        }

        // Validate AccountType
        if (!accountType) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_ACCOUNT_TYPE',
                    message: 'Valid account type is required'
                }
            });
            return;
        }


        logger.info(`Creating account for user ${userId}`, {
            chainId,
            walletID,
            accountType,
        });

        const result = await createUserAccount(userId, chainId, walletID, accountType);

        if (result.success) {
            res.status(result.alreadyExists ? 200 : 201).json({
                success: true,
                data: {
                    smartAccount: result.account,
                    account: result.account,
                    alreadyExists: !!result.alreadyExists
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: {
                    code: 'SMART_ACCOUNT_CREATION_FAILED',
                    message: result.error
                }
            });
        }

    } catch (error) {
        next(error);
    }
}

export async function getMySmartAccounts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'User authentication required'
                }
            });
            return;
        }

        const {chainId} = req.query;

        if (!chainId) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_CHAIN_ID',
                    message: 'Chain ID is required as query parameter'
                }
            });
            return;
        }

        const result = await getUserAccounts(userId, parseInt(chainId as string));

        if (result.success) {
            res.status(200).json({
                success: true,
                data: {
                    accounts: result.accounts || []
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: {
                    code: 'GET_ACCOUNTS_FAILED',
                    message: result.error
                }
            });
        }

    } catch (error) {
        next(error);
    }
}

export async function getSmartAccountDetails(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'User authentication required'
                }
            });
            return;
        }

        const {address} = req.params;
        const {chainId} = req.query;

        if (!address) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_ADDRESS',
                    message: 'Smart account address is required'
                }
            });
            return;
        }

        if (!chainId) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_CHAIN_ID',
                    message: 'Chain ID is required as query parameter'
                }
            });
            return;
        }

        const chainIdStr = typeof chainId === 'string' ? chainId : String(chainId);
        const addressStr = typeof address === 'string' ? address : String(address);
        const result = await getAccountDetails(addressStr, parseInt(chainIdStr, 10));

        if (result.success && result.account) {
            // Security check: ensure user owns this smart account
            if (result.account.userId !== userId) {
                res.status(403).json({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'You do not have permission to view this smart account details'
                    }
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: {
                    account: result.account
                }
            });
        } else {
            res.status(404).json({
                success: false,
                error: {
                    code: 'ACCOUNT_NOT_FOUND',
                    message: result.error
                }
            });
        }

    } catch (error) {
        next(error);
    }
}
