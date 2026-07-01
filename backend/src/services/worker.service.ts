import {TransactionModel} from '../models';
import {executeTransactionOnChain} from './transaction.service';
import {reconcileAllAccountsDeploymentStatus} from './account.service';
import {runBackgroundPortfolioSync} from './portfolio.service';
import {createServiceLogger, logContextStorage} from '../utils';
import {bundlerProvider} from './provider.service';
import crypto from 'crypto';
import {getRedisClient} from './redis.service';

const logger = createServiceLogger('Queue');
let running = false;
let isProcessingJob = false;
const workerInstanceId = `worker-${crypto.randomUUID().substring(0, 8)}`;

let intervalId: NodeJS.Timeout | null = null;
let reconciliationIntervalId: NodeJS.Timeout | null = null;
let portfolioSyncIntervalId: NodeJS.Timeout | null = null;
let staleRecoveryIntervalId: NodeJS.Timeout | null = null;
let heartbeatIntervalId: NodeJS.Timeout | null = null;

export function getWorkerStatus(): boolean {
    return running;
}

export function getWorkerInstanceId(): string {
    return workerInstanceId;
}

async function writeHeartbeat() {
    try {
        const redis = getRedisClient();
        if (redis) {
            await redis.set(`worker:heartbeat:${workerInstanceId}`, 'active', 'EX', 10);
        }
        logger.debug(`Worker heartbeat ping: ${workerInstanceId}`);
    } catch (err) {
        logger.error('Failed to write worker heartbeat', err as Error);
    }
}

export async function startWorker() {
    if (running) return;
    running = true;
    logger.info('Started');

    // Initial crash recovery path: Reset stuck processing transactions back to queued on crash restart
    try {
        const recovered = await TransactionModel.updateMany(
            { status: 'processing' },
            { $set: { status: 'queued', failureReason: 'Recovered after worker restart' } }
        );
        if (recovered.modifiedCount > 0) {
            logger.debug(`Recovered ${recovered.modifiedCount} stuck processing jobs.`);
        }
    } catch (err) {
        logger.error('Failed to run queue crash recovery', err as Error);
    }

    // Recover stuck submitted transactions
    await recoverSubmittedTransactions();

    // Heartbeat loop (every 5 seconds)
    await writeHeartbeat();
    heartbeatIntervalId = setInterval(writeHeartbeat, 5000);

    // Queue worker polling loop (every 2 seconds)
    intervalId = setInterval(async () => {
        try {
            await processQueue();
        } catch (error) {
            logger.error('Worker loop error', error as Error);
        }
    }, 2000);

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

    // Run stale job recovery every 60 seconds
    staleRecoveryIntervalId = setInterval(async () => {
        try {
            await recoverStaleJobs();
        } catch (error) {
            logger.error('Stale job recovery worker error', error as Error);
        }
    }, 60000);
}

export async function stopWorker() {
    running = false;
    
    // Clear all interval timers immediately
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
    if (staleRecoveryIntervalId) {
        clearInterval(staleRecoveryIntervalId);
        staleRecoveryIntervalId = null;
    }
    if (heartbeatIntervalId) {
        clearInterval(heartbeatIntervalId);
        heartbeatIntervalId = null;
    }

    // Graceful shutdown: wait for active job to finish execution
    if (isProcessingJob) {
        logger.info('Waiting for active transaction job to complete...');
        let checks = 0;
        while (isProcessingJob && checks < 30) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            checks++;
        }
    }

    logger.info('Stopped');
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
        let isReady = false;
        if (t.status === 'queued') {
            isReady = true;
        } else if (t.status === 'retrying') {
            // Exponential backoff check with 5 minutes (300,000ms) maximum delay cap
            const backoffMs = Math.min(Math.pow(2, t.retryCount) * 2000, 300000);
            if (now - t.updatedAt.getTime() >= backoffMs) {
                isReady = true;
            }
        }

        if (isReady) {
            // Concurrency safety: serialize transactions per smart account to prevent nonce collisions
            const activeJob = await TransactionModel.findOne({
                status: { $in: ['processing', 'submitted'] },
                chainId: t.chainId,
                accountId: t.accountId
            });

            if (!activeJob) {
                targetTx = t;
                break; // Found a ready transaction on an idle account!
            }
        }
    }

    if (!targetTx) return;

    // Atomically claim the transaction job
    const tx = await TransactionModel.findOneAndUpdate(
        { _id: targetTx._id, status: targetTx.status },
        {
            $set: {
                status: 'processing',
                startedAt: new Date(),
                workerId: workerInstanceId,
                updatedAt: new Date()
            }
        },
        { new: true }
    );

    if (tx) {
        const context = {
            requestId: tx.requestId,
            transactionId: tx.id || String(tx._id),
            userId: tx.userId,
            accountId: tx.accountId,
            chainId: tx.chainId
        };
        isProcessingJob = true;
        try {
            await logContextStorage.run(context, async () => {
                logger.info(`Processing ${tx.id || tx._id}`);
                await executeTransactionOnChain(tx);
            });
        } finally {
            isProcessingJob = false;
        }
    }
}

async function recoverStaleJobs() {
    logger.debug('Running stale transaction job recovery check');

    // 1. Recover processing jobs stuck for more than 5 minutes (e.g. worker process crashed)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    try {
        const staleProcessing = await TransactionModel.updateMany(
            { 
                status: 'processing',
                updatedAt: { $lt: fiveMinutesAgo }
            },
            { 
                $set: { 
                    status: 'queued', 
                    failureReason: 'Recovered stuck processing transaction (heartbeat timeout)' 
                } 
            }
        );
        if (staleProcessing.modifiedCount > 0) {
            logger.debug(`Recovered ${staleProcessing.modifiedCount} stuck processing jobs.`);
        }
    } catch (err) {
        logger.error('Failed to recover stale processing jobs', err as Error);
    }

    // 2. Recover stuck submitted transactions by querying their status via the bundler
    await recoverSubmittedTransactions();
}

async function recoverSubmittedTransactions() {
    try {
        const submittedTxs = await TransactionModel.find({ status: 'submitted' });
        if (submittedTxs.length === 0) return;

        logger.debug(`Found ${submittedTxs.length} stuck submitted transactions. Resolving...`);
        for (const tx of submittedTxs) {
            try {
                if (!tx.userOpHash) {
                    tx.status = 'queued';
                    tx.failureReason = 'Recovered missing hash on worker audit';
                    await tx.save();
                    continue;
                }

                // Query the status via the bundler
                const result = await bundlerProvider.getUserOperation(tx.userOpHash as `0x${string}`, tx.chainId, tx.bundlerID || 'ALCHEMY').catch(() => null);

                if (result && result.status === 'confirmed') {
                    tx.status = 'confirmed';
                    tx.hash = result.receipts?.[0]?.transactionHash || tx.hash;
                    tx.completedAt = new Date();
                    await tx.save();
                    logger.info('Transaction confirmed', { txId: tx.id });
                } else if (result && result.status === 'failed') {
                    tx.status = 'failed';
                    tx.failureReason = 'UserOperation failed on-chain (recovered on restart)';
                    tx.completedAt = new Date();
                    await tx.save();
                    logger.info('Transaction failed', { txId: tx.id, reason: tx.failureReason });
                } else {
                    tx.status = 'queued';
                    tx.failureReason = 'Reset stuck submitted transaction on worker restart';
                    await tx.save();
                    logger.debug(`Reset stuck submitted transaction ${tx.id} back to queued`);
                }
            } catch (err) {
                logger.error(`Failed to recover submitted transaction ${tx.id}`, err as Error);
            }
        }
    } catch (error) {
        logger.error('Failed to run submitted queue crash recovery', error as Error);
    }
}
