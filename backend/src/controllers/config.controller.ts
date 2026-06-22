import {Request, Response} from 'express';
import {SUPPORTED_WALLETS, SUPPORTED_PAYMASTER, SUPPORTED_BUNDLER} from '../config/config';
import {ALCHEMY_CHAIN_MAP} from '../config/chain';
import {createServiceLogger} from '../utils';

const logger = createServiceLogger('ConfigController');

export async function getCapabilities(req: Request, res: Response): Promise<void> {
    try {
        const chains = Object.entries(ALCHEMY_CHAIN_MAP).map(([id, name]) => ({
            id: parseInt(id),
            name: name
        }));

        logger.info('Retrieving capabilities discovery information');

        res.status(200).json({
            success: true,
            data: {
                supportedWallets: SUPPORTED_WALLETS,
                supportedChains: chains,
                supportedBundlers: SUPPORTED_BUNDLER,
                supportedPaymasters: SUPPORTED_PAYMASTER,
                sessionKeySupport: true,
                batchingSupport: true,
                deploymentSupport: true,
                gasSponsorshipSupport: true
            }
        });
    } catch (error) {
        logger.error('Failed to retrieve capabilities', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to retrieve capabilities'
            }
        });
    }
}

export async function validateCompatibility(req: Request, res: Response): Promise<void> {
    try {
        const { bundlerID, paymasterID, walletID, chainId } = req.body;

        logger.info('Validating provider capability compatibility', { bundlerID, paymasterID, walletID, chainId });

        if (!bundlerID || !SUPPORTED_BUNDLER.includes(bundlerID)) {
            res.status(400).json({
                success: false,
                data: {
                    compatible: false,
                    message: `Unsupported bundler: ${bundlerID}. Supported: ${SUPPORTED_BUNDLER.join(', ')}`
                }
            });
            return;
        }

        if (!paymasterID || !SUPPORTED_PAYMASTER.includes(paymasterID)) {
            res.status(400).json({
                success: false,
                data: {
                    compatible: false,
                    message: `Unsupported paymaster: ${paymasterID}. Supported: ${SUPPORTED_PAYMASTER.join(', ')}`
                }
            });
            return;
        }

        if (!walletID || !SUPPORTED_WALLETS.includes(walletID)) {
            res.status(400).json({
                success: false,
                data: {
                    compatible: false,
                    message: `Unsupported wallet implementation: ${walletID}. Supported: ${SUPPORTED_WALLETS.join(', ')}`
                }
            });
            return;
        }

        if (!chainId || !(chainId in ALCHEMY_CHAIN_MAP)) {
            res.status(400).json({
                success: false,
                data: {
                    compatible: false,
                    message: `Unsupported chain ID: ${chainId}. Supported IDs: ${Object.keys(ALCHEMY_CHAIN_MAP).join(', ')}`
                }
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: {
                compatible: true,
                message: "Provider configuration is fully compatible."
            }
        });
    } catch (error) {
        logger.error('Failed to validate capability compatibility', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to validate compatibility'
            }
        });
    }
}
