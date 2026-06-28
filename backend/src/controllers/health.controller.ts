import mongoose from "mongoose";
import {Request, Response} from "express";
import {createServiceLogger, getRPC_URL, metrics} from "../utils";
import {getWorkerStatus} from "../services/worker.service";
import {config, validateConfig} from "../config/config";
import {isRedisAvailable} from "../services/redis.service";

const logger = createServiceLogger('HealthController');

// Liveness check - checks if application process is alive
export const liveness = (req: Request, res: Response) => {
    return res.status(200).json({
        status: "UP",
        timestamp: new Date().toISOString(),
        service: "liveness"
    });
};

// Startup check - checks if the application config successfully initialized
export const startup = (req: Request, res: Response) => {
    try {
        validateConfig();
        return res.status(200).json({
            status: "UP",
            timestamp: new Date().toISOString(),
            service: "startup"
        });
    } catch (err: any) {
        logger.error("Startup validation failed", err);
        return res.status(503).json({
            status: "DOWN",
            timestamp: new Date().toISOString(),
            service: "startup",
            error: err.message
        });
    }
};

// Generic URL ping helper
async function checkUrlHealth(url: string): Promise<boolean> {
    if (!url) return false;
    try {
        // Alchemy Smart Wallet/Bundler APIs don't support web3_clientVersion on api.g.alchemy.com
        // and will return HTTP 500. We use eth_supportedEntryPoints for those.
        const isAlchemySmartWalletApi = url.includes("api.g.alchemy.com");
        const method = isAlchemySmartWalletApi ? 'eth_supportedEntryPoints' : 'web3_clientVersion';

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', method, params: [], id: 1 }),
            signal: AbortSignal.timeout(3000) // 3 seconds timeout
        });
        return response.ok;
    } catch {
        return false;
    }
}

// Readiness check - performs deep dependencies validation
export const readiness = async (req: Request, res: Response) => {
    const checks: Record<string, any> = {};
    let isHealthy = true;

    try {
        // 1. Verify MongoDB Connection
        const dbState = mongoose.connection.readyState;
        const isDbConnected = dbState === 1;
        checks.database = {
            status: isDbConnected ? "UP" : "DOWN",
            state: dbState
        };
        if (!isDbConnected) isHealthy = false;

        // 2. Verify Background Queue Worker
        const isWorkerRunning = getWorkerStatus();
        checks.worker = {
            status: isWorkerRunning ? "UP" : "DOWN"
        };
        if (!isWorkerRunning) isHealthy = false;

        // 3. Verify RPC Provider connectivity (Base Sepolia)
        const baseRpcUrl = getRPC_URL(84532);
        const rpcOk = await checkUrlHealth(baseRpcUrl);
        checks.rpcProvider = {
            status: rpcOk ? "UP" : "DOWN"
        };
        if (!rpcOk) isHealthy = false;

        // 4. Verify Bundler/Paymaster Providers
        // Check Alchemy RPC/Paymaster health if configured
        if (config.alchemy.apiKey) {
            const alchemyUrl = `https://api.g.alchemy.com/v2/${config.alchemy.apiKey}`;
            const alchemyOk = await checkUrlHealth(alchemyUrl);
            checks.alchemy = {
                status: alchemyOk ? "UP" : "DOWN"
            };
            if (!alchemyOk) isHealthy = false;
        }

        // Check Pimlico RPC/Paymaster health if configured
        if (config.pimlico.apiKey) {
            const pimlicoUrl = `https://api.pimlico.io/v2/84532/rpc?apikey=${config.pimlico.apiKey}`;
            const pimlicoOk = await checkUrlHealth(pimlicoUrl);
            checks.pimlico = {
                status: pimlicoOk ? "UP" : "DOWN"
            };
            if (!pimlicoOk) isHealthy = false;
        }

        // 5. Verify Redis connectivity if enabled
        if (config.redis.enabled) {
            const redisOk = isRedisAvailable();
            checks.redis = {
                status: redisOk ? "UP" : "DOWN"
            };
            if (!redisOk) isHealthy = false;
        }

        const httpStatus = isHealthy ? 200 : 503;
        return res.status(httpStatus).json({
            status: isHealthy ? "UP" : "DOWN",
            timestamp: new Date().toISOString(),
            checks
        });

    } catch (err: any) {
        logger.error("Readiness health check failed", err);
        return res.status(503).json({
            status: "DOWN",
            timestamp: new Date().toISOString(),
            error: err.message
        });
    }
};

// Metrics endpoint - exposes runtime Prometheus/Structured metrics
export const getMetrics = async (req: Request, res: Response) => {
    try {
        const metricsKey = config.security.metricsKey;
        const clientKey = req.headers['x-metrics-key'] || req.query.metrics_key;
        
        if (metricsKey && clientKey !== metricsKey) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED_METRICS_ACCESS',
                    message: 'Access to system metrics is restricted.'
                }
            });
        }

        const payload = await metrics.getMetricsPayload();
        return res.status(200).json(payload);
    } catch (err: any) {
        logger.error("Failed to retrieve system metrics", err);
        return res.status(500).json({
            success: false,
            error: {
                code: 'METRICS_COLLECTION_FAILED',
                message: err.message || 'Failed to collect runtime metrics',
                requestId: (req as any).requestId || 'unknown',
                timestamp: new Date().toISOString()
            }
        });
    }
};

// Deprecated single fallback check
export const health = readiness;