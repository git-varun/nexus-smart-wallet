import {Response} from 'express';
import {AuthenticatedRequest, getUserId} from '../middleware';
import {getPortfolio, syncPortfolio} from '../services/portfolio.service';
import {createServiceLogger} from '../utils';

const logger = createServiceLogger('PortfolioController');

export async function fetchPortfolio(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'User authentication required' }
            });
            return;
        }

        const {address, chainId} = req.query;

        if (!address) {
            res.status(400).json({
                success: false,
                error: { code: 'INVALID_ADDRESS', message: 'Smart account address is required' }
            });
            return;
        }

        if (!chainId) {
            res.status(400).json({
                success: false,
                error: { code: 'INVALID_CHAIN_ID', message: 'Chain ID is required' }
            });
            return;
        }

        const portfolio = await getPortfolio(userId, address as string, parseInt(chainId as string));
        res.status(200).json({
            success: true,
            data: {
                portfolio
            }
        });
    } catch (error) {
        logger.error('Fetch portfolio failed', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve portfolio assets' }
        });
    }
}

export async function refreshPortfolio(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'User authentication required' }
            });
            return;
        }

        const {address, chainId} = req.body;

        if (!address) {
            res.status(400).json({
                success: false,
                error: { code: 'INVALID_ADDRESS', message: 'Smart account address is required' }
            });
            return;
        }

        if (!chainId) {
            res.status(400).json({
                success: false,
                error: { code: 'INVALID_CHAIN_ID', message: 'Chain ID is required' }
            });
            return;
        }

        const portfolio = await syncPortfolio(userId, address as string, parseInt(chainId as string));
        res.status(200).json({
            success: true,
            data: {
                portfolio
            }
        });
    } catch (error) {
        logger.error('Refresh portfolio failed', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Failed to refresh portfolio assets' }
        });
    }
}
