import {TransactionModel, SessionKeyModel} from '../models';
import mongoose from 'mongoose';

class RollingAverage {
    private values: number[] = [];
    constructor(private limit: number = 100) {}

    add(val: number) {
        this.values.push(val);
        if (this.values.length > this.limit) {
            this.values.shift();
        }
    }

    get(): number {
        if (this.values.length === 0) return 0;
        return this.values.reduce((a, b) => a + b, 0) / this.values.length;
    }
}

export class MetricsCollector {
    private static instance: MetricsCollector;

    // API Metrics
    public apiRequestCount = 0;
    public apiErrorCount = 0;
    public apiLatency = new RollingAverage(100);
    public activeRequests = 0;

    // Blockchain Latencies
    public bundlerLatency = new RollingAverage(50);
    public rpcLatency = new RollingAverage(50);
    public paymasterLatency = new RollingAverage(50);
    public confirmationLatency = new RollingAverage(50);

    // Database Latencies
    public dbQueryLatency = new RollingAverage(100);
    public dbSlowQueries = 0;

    // Redis Latency
    public redisLatency = new RollingAverage(100);

    // Queue & Execution Latencies
    public queueProcessingTime = new RollingAverage(100);
    public transactionDuration = new RollingAverage(100);
    public walletDeploymentDuration = new RollingAverage(100);
    public errorCount = 0;

    private constructor() {}

    public static getInstance(): MetricsCollector {
        if (!MetricsCollector.instance) {
            MetricsCollector.instance = new MetricsCollector();
        }
        return MetricsCollector.instance;
    }

    public trackApiRequest(statusCode: number, latencyMs: number) {
        this.apiRequestCount += 1;
        if (statusCode >= 400) {
            this.apiErrorCount += 1;
        }
        this.apiLatency.add(latencyMs);
    }

    public trackBundlerCall(latencyMs: number) {
        this.bundlerLatency.add(latencyMs);
    }

    public trackRpcCall(latencyMs: number) {
        this.rpcLatency.add(latencyMs);
    }

    public trackPaymasterCall(latencyMs: number) {
        this.paymasterLatency.add(latencyMs);
    }

    public trackConfirmation(latencyMs: number) {
        this.confirmationLatency.add(latencyMs);
    }

    public trackDbQuery(latencyMs: number) {
        this.dbQueryLatency.add(latencyMs);
        if (latencyMs > 100) {
            this.dbSlowQueries += 1;
        }
    }

    public trackRedisCall(latencyMs: number) {
        this.redisLatency.add(latencyMs);
    }

    public trackQueueProcessing(latencyMs: number) {
        this.queueProcessingTime.add(latencyMs);
    }

    public trackTransactionDuration(latencyMs: number) {
        this.transactionDuration.add(latencyMs);
    }

    public trackWalletDeployment(latencyMs: number) {
        this.walletDeploymentDuration.add(latencyMs);
    }

    public trackError() {
        this.errorCount += 1;
    }

    public async getMetricsPayload() {
        // Collect real-time metrics from the database
        const queueDepth = await TransactionModel.countDocuments({ status: { $in: ['queued', 'retrying'] } });
        const activeJobs = await TransactionModel.countDocuments({ status: { $in: ['processing', 'submitted'] } });
        
        const totalTx = await TransactionModel.countDocuments({});
        const successTx = await TransactionModel.countDocuments({ status: 'confirmed' });
        const failedTx = await TransactionModel.countDocuments({ status: 'failed' });
        
        // Sum of all retry counts
        const retryAgg = await TransactionModel.aggregate([
            { $group: { _id: null, totalRetries: { $sum: '$retryCount' } } }
        ]);
        const totalRetries = retryAgg[0]?.totalRetries || 0;

        // Session Key Metrics
        const totalSessionKeys = await SessionKeyModel.countDocuments({});
        const activeSessionKeys = await SessionKeyModel.countDocuments({ isActive: true });
        const revokedSessionKeys = await SessionKeyModel.countDocuments({ isActive: false });

        // DB Connection status
        const dbState = mongoose.connection.readyState;
        const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';

        return {
            timestamp: new Date().toISOString(),
            api: {
                requestCount: this.apiRequestCount,
                errorCount: this.apiErrorCount,
                averageLatencyMs: Math.round(this.apiLatency.get() * 100) / 100,
                activeRequests: this.activeRequests,
                throughputPerSecond: this.apiRequestCount > 0 ? (this.apiRequestCount / (process.uptime() || 1)) : 0
            },
            worker: {
                queueDepth,
                activeJobs,
                totalRetries,
                successRate: totalTx > 0 ? (successTx / totalTx) : 1,
                failureRate: totalTx > 0 ? (failedTx / totalTx) : 0
            },
            blockchain: {
                averageBundlerLatencyMs: Math.round(this.bundlerLatency.get() * 100) / 100,
                averageRpcLatencyMs: Math.round(this.rpcLatency.get() * 100) / 100,
                averagePaymasterLatencyMs: Math.round(this.paymasterLatency.get() * 100) / 100,
                averageConfirmationLatencyMs: Math.round(this.confirmationLatency.get() * 100) / 100
            },
            sessionKeys: {
                totalCount: totalSessionKeys,
                activeCount: activeSessionKeys,
                revokedCount: revokedSessionKeys
            },
            database: {
                averageQueryLatencyMs: Math.round(this.dbQueryLatency.get() * 100) / 100,
                slowQueriesCount: this.dbSlowQueries,
                connectionStatus: dbStatus,
                connectionPoolSize: mongoose.connection.db ? (await mongoose.connection.db.admin().serverStatus()).connections.current : 0
            },
            redis: {
                averageLatencyMs: Math.round(this.redisLatency.get() * 100) / 100
            },
            performance: {
                averageQueueProcessingTimeMs: Math.round(this.queueProcessingTime.get() * 100) / 100,
                averageTransactionDurationMs: Math.round(this.transactionDuration.get() * 100) / 100,
                averageWalletDeploymentDurationMs: Math.round(this.walletDeploymentDuration.get() * 100) / 100,
                totalErrors: this.errorCount
            }
        };
    }
}

export const metrics = MetricsCollector.getInstance();
