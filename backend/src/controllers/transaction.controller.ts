import {Response} from 'express';
import {AuthenticatedRequest, getUserId} from '../middleware';
import {
    deploySmartAccountService,
    estimateGas,
    getGasPriceObject,
    getUserOperationStatus,
    getUserTransactionHistory,
    sendTransaction as sendTransactionService
} from '../services/transaction.service';
import {createServiceLogger} from '../utils';

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

        const result = await sendTransactionService(
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

        const result = await deploySmartAccountService(
            userId,
            chainId,
            walletID,
            paymasterID,
            bundlerID,
        );

        if (result.success) {
            res.status(200).json({
                success: true,
                data: {
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
        const {callerId, chainId} = req.body;

        if (!callerId) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_CALLER_ID',
                    message: 'Caller ID is required'
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

        logger.info('Getting user operation status', callerId, chainId);

        const result = await getUserOperationStatus(callerId, chainId);

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

        logger.info('Get transaction history request', {userId, chainId});

        const result = await getUserTransactionHistory(userId, parseInt(chainId as string));

        if (result.success) {
            res.status(200).json({
                success: true,
                data: {
                    transactions: result.transactions,
                    count: result.transactions?.length || 0
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: {
                    code: 'HISTORY FAILED',
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

        const {chainId, bundlerID} = req.body;
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

        logger.info('Get latest transaction gas price', chainId, bundlerID);

        const result = await getGasPriceObject(chainId, bundlerID);

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
