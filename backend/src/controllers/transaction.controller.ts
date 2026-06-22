import {Response} from 'express';
import {AuthenticatedRequest, getUserId} from '../middleware';
import {
    deploySmartAccountService,
    estimateGas,
    getGasPriceObject,
    getUserOperationStatus,
    getUserTransactionHistory,
    sendTransaction as sendTransactionService,
    sendTransactionBatch as sendTransactionBatchService
} from '../services/transaction.service';
import {createServiceLogger} from '../utils';
import {transactionRepository} from '../repositories';


const logger = createServiceLogger('TransactionController');

export async function sendTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
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

        const {to, data, value, chainId, walletID, paymasterID, bundlerID} = req.body;

        if (!to) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_RECIPIENT',
                    message: 'Recipient address is required'
                }
            });
            return;
        }

        if (!chainId) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_CHAIN_ID',
                    message: 'Chain ID is required'
                }
            });
            return;
        }

        if (!walletID) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_WALLET_ID',
                    message: 'Chain ID is required'
                }
            });
            return;
        }

        if (!paymasterID) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_PAYMASTER_ID',
                    message: 'Chain ID is required'
                }
            });
            return;
        }

        if (!bundlerID) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_BUNDLER_ID',
                    message: 'Chain ID is required'
                }
            });
            return;
        }

        logger.info('Send transaction request', {
            userId,
            to,
            hasData: !!data,
            value,
            chainId,
            walletID,
            paymasterID,
            bundlerID
        });

        const idempotencyKey = req.body.idempotencyKey || req.header('Idempotency-Key');

        const result = await sendTransactionService(
            userId,
            chainId,
            walletID,
            paymasterID,
            bundlerID,
            {to, data, value: value?.toString(), idempotencyKey}
        );

        if (result.success && result.transaction) {
            res.status(200).json({
                success: true,
                data: {
                    transactionId: result.transaction.id,
                    status: result.transaction.status,
                    createdAt: result.transaction.createdAt,
                    transaction: result.transaction
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: {
                    code: 'TRANSACTION FAILED',
                    message: result.error
                }
            });
        }

    } catch (error) {
        logger.error('Send transaction failed', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to send transaction'
            }
        });
    }
}

export async function deploySmartWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
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

        const {chainId, walletID, paymasterID, bundlerID} = req.body;


        if (!chainId) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_CHAIN_ID',
                    message: 'Chain ID is required'
                }
            });
            return;
        }

        if (!walletID) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_WALLET_ID',
                    message: 'Chain ID is required'
                }
            });
            return;
        }

        if (!paymasterID) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_PAYMASTER_ID',
                    message: 'Chain ID is required'
                }
            });
            return;
        }

        if (!bundlerID) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_BUNDLER_ID',
                    message: 'Chain ID is required'
                }
            });
            return;
        }

        logger.info('Send transaction request', {
            userId,
            chainId,
            walletID,
            paymasterID,
            bundlerID
        });

        const idempotencyKey = req.body.idempotencyKey || req.header('Idempotency-Key');

        const result = await deploySmartAccountService(
            userId,
            chainId,
            walletID,
            paymasterID,
            bundlerID,
            idempotencyKey
        );

        if (result.success && result.transaction) {
            res.status(200).json({
                success: true,
                data: {
                    transactionId: result.transaction.id,
                    status: result.transaction.status,
                    createdAt: result.transaction.createdAt,
                    transaction: result.transaction
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: {
                    code: 'TRANSACTION FAILED',
                    message: result.error
                }
            });
        }

    } catch (error) {
        logger.error('Send transaction failed', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to send transaction'
            }
        });
    }
}

export async function getOperationStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const {userOpHash, chainId, bundlerId} = req.body;

        if (!userOpHash) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_USER_OP_HASH',
                    message: 'UserOp Hash is required'
                }
            });
            return;
        }

        if (!bundlerId) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_BUNDLER_ID',
                    message: 'Bundler ID is required'
                }
            });
            return;
        }

        if (!chainId) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_CHAIN_ID',
                    message: 'Chain ID is required'
                }
            });
            return;
        }

        logger.info('Getting user operation status', userOpHash, chainId);

        const result = await getUserOperationStatus(chainId, userOpHash, bundlerId);

        if (result.success) {
            res.status(200).json({
                success: true,
                data: result.receipts
            })
        } else {
            res.status(400).json({
                success: false,
                error: {
                    code: 'STATUS_CALL_FAILED',
                    message: result.error
                }
            })
        }
    } catch (error) {
        logger.error('Getting user operation status failed', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to send transaction'
            }
        });
    }
}

export async function getTransactionHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
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

        const {
            chainId,
            status,
            search,
            to,
            paymasterID,
            bundlerID,
            page,
            limit,
            sortBy,
            sortOrder
        } = req.query;

        logger.info('Get transaction history request', {userId, chainId, status, search, to, page, limit});

        const filters = {
            chainId: chainId ? parseInt(chainId as string) : undefined,
            status: status as string,
            search: search as string,
            to: to as string,
            paymasterID: paymasterID as string,
            bundlerID: bundlerID as string,
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
            sortBy: sortBy as string,
            sortOrder: sortOrder as 'asc' | 'desc'
        };

        const result = await getUserTransactionHistory(
            userId,
            filters
        );

        if (result.success) {
            res.status(200).json({
                success: true,
                data: {
                    transactions: result.transactions,
                    pagination: result.pagination
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: {
                    code: 'HISTORY_FAILED',
                    message: result.error
                }
            });
        }

    } catch (error) {
        logger.error('Get transaction history failed', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to get transaction history'
            }
        });
    }
}

export async function getGasEstimation(req: AuthenticatedRequest, res: Response): Promise<void> {
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

        const {to, data, value, chainId, walletID, paymasterID, bundlerID} = req.body;

        if (!to) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING RECIPIENT',
                    message: 'Recipient address is required'
                }
            });
            return;
        }

        if (!chainId) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_CHAIN_ID',
                    message: 'Chain ID is required'
                }
            });
            return;
        }

        if (!walletID) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_WALLET_ID',
                    message: 'Chain ID is required'
                }
            });
            return;
        }

        if (!paymasterID) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_PAYMASTER_ID',
                    message: 'Chain ID is required'
                }
            });
            return;
        }

        if (!bundlerID) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_BUNDLER_ID',
                    message: 'Chain ID is required'
                }
            });
            return;
        }

        logger.info('Gas estimation request', {
            userId,
            to,
            hasData: !!data,
            value,
            chainId,
            walletID,
            paymasterID,
            bundlerID
        });

        const result = await estimateGas(
            userId,
            chainId,
            walletID,
            paymasterID,
            bundlerID,
            {to, data, value: value?.toString()}
        );

        if (result.success) {
            res.status(200).json({
                success: true,
                data: {
                    gasEstimate: result.gasEstimate
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: {
                    code: 'ESTIMATION FAILED',
                    message: result.error
                }
            });
        }

    } catch (error) {
        logger.error('Gas estimation failed', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to estimate gas'
            }
        });
    }
}

export async function getGasPrice(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {

        const {chainId, bundlerID} = req.query as { chainId?: string; bundlerID?: string };
        if (!chainId) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_CHAIN_ID',
                    message: 'Chain ID is required'
                }
            });
            return;
        }

        if (!bundlerID) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_BUNDLER_ID',
                    message: 'Chain ID is required'
                }
            });
            return;
        }

        logger.info('Get latest transaction gas price', {
            chainId: String(chainId),
            bundlerID: String(bundlerID)
        });

        const result = await getGasPriceObject(parseInt(chainId as string), bundlerID as string);

        if (result.success) {
            res.status(200).json({
                success: true,
                data: result.gasPrice
            });
        } else {
            res.status(400).json({
                success: false,
                error: {
                    code: 'GAS_PRICE_FAILED',
                    message: result.error
                }
            });
        }

    } catch (error) {
        logger.error('Get transaction history failed', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to get transaction history'
            }
        });
    }
}

export async function getTransactionDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
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

        const { idOrHash } = req.params;
        if (!idOrHash) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_PARAM',
                    message: 'Transaction ID or Hash is required'
                }
            });
            return;
        }

        const idOrHashStr = typeof idOrHash === 'string' ? idOrHash : String(idOrHash);
        logger.info('Get transaction details request', { userId, idOrHash: idOrHashStr });

        let transaction = null;
        // Check if idOrHash is a valid Mongoose ObjectId
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(idOrHashStr);
        if (isValidObjectId) {
            transaction = await transactionRepository.findTransactionById(idOrHashStr);
        } else {
            // Check if it's a transaction hash or userOpHash
            transaction = await transactionRepository.findTransactionByHash(idOrHashStr) 
                || await transactionRepository.findTransactionByUserOpHash(idOrHashStr);
        }

        if (!transaction) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'TRANSACTION_NOT_FOUND',
                    message: 'Transaction not found'
                }
            });
            return;
        }

        // Security check: ensure user owns this transaction
        if (transaction.userId !== userId) {
            res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'You do not have permission to view this transaction'
                }
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: {
                transaction
            }
        });
    } catch (error) {
        logger.error('Get transaction details failed', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to get transaction details'
            }
        });
    }
}

export async function sendTransactionBatch(req: AuthenticatedRequest, res: Response): Promise<void> {
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

        const {calls, chainId, walletID, paymasterID, bundlerID} = req.body;

        if (!calls || !Array.isArray(calls) || calls.length === 0) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_CALLS',
                    message: 'Calls array is required and must not be empty'
                }
            });
            return;
        }

        if (!chainId) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_CHAIN_ID',
                    message: 'Chain ID is required'
                }
            });
            return;
        }

        if (!walletID) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_WALLET_ID',
                    message: 'Wallet ID is required'
                }
            });
            return;
        }

        if (!paymasterID) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_PAYMASTER_ID',
                    message: 'Paymaster ID is required'
                }
            });
            return;
        }

        if (!bundlerID) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_BUNDLER_ID',
                    message: 'Bundler ID is required'
                }
            });
            return;
        }

        logger.info('Send batch transaction request', {
            userId,
            callsCount: calls.length,
            chainId,
            walletID,
            paymasterID,
            bundlerID
        });

        const idempotencyKey = req.body.idempotencyKey || req.header('Idempotency-Key');

        const result = await sendTransactionBatchService(
            userId,
            chainId,
            walletID,
            paymasterID,
            bundlerID,
            {calls, idempotencyKey}
        );

        if (result.success && result.transaction) {
            res.status(200).json({
                success: true,
                data: {
                    transactionId: result.transaction.id,
                    status: result.transaction.status,
                    createdAt: result.transaction.createdAt,
                    transaction: result.transaction
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: {
                    code: 'TRANSACTION_FAILED',
                    message: result.error
                }
            });
        }

    } catch (error) {
        logger.error('Send batch transaction failed', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to send batch transaction'
            }
        });
    }
}


