import {TransactionModel} from '../models';
import {executeTransactionOnChain} from './transaction.service';
import {reconcileAllAccountsDeploymentStatus} from './account.service';
import {runBackgroundPortfolioSync} from './portfolio.service';
import {createServiceLogger} from '../utils';

const logger = createServiceLogger('QueueWorker');
let running = false;
let intervalId: NodeJS.Timeout | null = null;
let reconciliationIntervalId: NodeJS.Timeout | null = null;
let portfolioSyncIntervalId: NodeJS.Timeout | null = null;

export function getWorkerStatus(): boolean {
    return running;
}

export async function startWorker() {
    if (running) return;
    running = true;
    logger.info('🚀 Transaction Queue Worker starting...');

    // Recovery path: Reset stuck processing transactions back to queued on crash restart
    try {
        const recovered = await TransactionModel.updateMany(
            { status: 'processing' },
            { $set: { status: 'queued', failureReason: 'Recovered after worker restart' } }
        );
        if (recovered.modifiedCount > 0) {
            logger.info(`🔄 Recovered ${recovered.modifiedCount} stuck processing jobs.`);
        }
    } catch (err) {
        logger.error('Failed to run queue crash recovery', err as Error);
    }

    intervalId = setInterval(async () => {
        try {
            await processQueue();
        } catch (error) {
            logger.error('Worker loop error', error as Error);
        }
    }, 2000); // Poll database every 2 seconds

    // Run reconciliation on start, then every 30 seconds
    reconcileAllAccountsDeploymentStatus().catch(err => logger.error('Failed initial reconciliation', err));
    reconciliationIntervalId = setInterval(async () => {
        try {
            await reconcileAllAccountsDeploymentStatus();
        } catch (error) {
            logger.error('Reconciliation worker error', error as Error);
        }
    }, 30000);

    // Run portfolio sync on start, then every 15 minutes
    runBackgroundPortfolioSync().catch(err => logger.error('Failed initial portfolio sync', err));
    portfolioSyncIntervalId = setInterval(async () => {
        try {
            await runBackgroundPortfolioSync();
        } catch (error) {
            logger.error('Portfolio background sync error', error as Error);
        }
    }, 900000);
}

export async function stopWorker() {
    running = false;
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    if (reconciliationIntervalId) {
        clearInterval(reconciliationIntervalId);
        reconciliationIntervalId = null;
    }
    if (portfolioSyncIntervalId) {
        clearInterval(portfolioSyncIntervalId);
        portfolioSyncIntervalId = null;
    }
    logger.info('🛑 Transaction Queue Worker stopped');
}

async function processQueue() {
    if (!running) return;

    // Find all queued or retrying transactions
    const txs = await TransactionModel.find({
        status: { $in: ['queued', 'retrying'] }
    }).sort({ createdAt: 1 });

    let targetTx: any = null;
    const now = Date.now();

    for (const t of txs) {
        if (t.status === 'queued') {
            targetTx = t;
            break;
        }
        if (t.status === 'retrying') {
            // Exponential backoff: 2^retryCount * 2000 ms
            const backoffMs = Math.pow(2, t.retryCount) * 2000;
            if (now - t.updatedAt.getTime() >= backoffMs) {
                targetTx = t;
                break;
            }
        }
    }

    if (!targetTx) return;

    // Concurrency safety: serialize transactions per smart account to prevent nonce collisions
    const activeJob = await TransactionModel.findOne({
        status: { $in: ['processing', 'submitted'] },
        chainId: targetTx.chainId,
        accountId: targetTx.accountId
    });

    if (activeJob) {
        // Skip for now to preserve sequence execution order
        return;
    }

    // Atomically claim the transaction job
    const tx = await TransactionModel.findOneAndUpdate(
        { _id: targetTx._id, status: targetTx.status },
        {
            $set: {
                status: 'processing',
                startedAt: new Date(),
                workerId: 'worker-node-1',
                updatedAt: new Date()
            }
        },
        { new: true }
    );

    if (tx) {
        logger.info(`Processing transaction job ${tx.id} for user ${tx.userId}`);
        await executeTransactionOnChain(tx);
    }
}
