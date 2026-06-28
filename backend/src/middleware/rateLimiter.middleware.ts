import {Request, Response, NextFunction} from 'express';
import {config} from '../config/config';
import {getRedisClient, isRedisAvailable} from '../services/redis.service';

interface RateLimitStoreEntry {
    count: number;
    resetTime: number;
}

// In-memory store (acts as backup / graceful degradation fallback)
const fallbackStore = new Map<string, RateLimitStoreEntry>();

// Eviction worker to prevent memory leak in fallback store
const evictionInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of fallbackStore.entries()) {
        if (now > value.resetTime) {
            fallbackStore.delete(key);
        }
    }
}, 60000); // Clean up expired in-memory entries every minute

if (typeof evictionInterval.unref === 'function') {
    evictionInterval.unref();
}

interface RateLimitOptions {
    windowMs: number;
    max: number;
    message: string;
    code: string;
}

export function createRateLimiter(options: RateLimitOptions) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        // Skip rate limit in test environment unless explicitly needed
        if (config.nodeEnv === 'test') {
            next();
            return;
        }

        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const key = `ratelimit:${req.baseUrl || ''}${req.path}:${ip}`;
        const now = Date.now();

        let currentCount = 0;
        let resetTime = now + options.windowMs;

        const redis = getRedisClient();

        if (redis && isRedisAvailable()) {
            try {
                // Redis implementation (Atomic transaction using Multi)
                const pipeline = redis.multi();
                pipeline.incr(key);
                pipeline.ttl(key);
                const results = await pipeline.exec();
                
                if (results) {
                    const countResult = results[0][1];
                    const ttlResult = results[1][1];

                    if (typeof countResult === 'number') {
                        currentCount = countResult;
                        // Set TTL on first request in the window
                        if (currentCount === 1) {
                            await redis.expire(key, Math.ceil(options.windowMs / 1000));
                            resetTime = now + options.windowMs;
                        } else if (typeof ttlResult === 'number' && ttlResult > 0) {
                            resetTime = now + (ttlResult * 1000);
                        }
                    }
                }
            } catch (err) {
                // Connection failed - fallback to in-memory store
                console.error("Redis rate limiter error, falling back to local memory store:", err);
                const result = runFallbackLimiter(key, options, now);
                currentCount = result.count;
                resetTime = result.resetTime;
            }
        } else {
            // Redis unavailable - use fallback store
            const result = runFallbackLimiter(key, options, now);
            currentCount = result.count;
            resetTime = result.resetTime;
        }

        res.setHeader('X-RateLimit-Limit', options.max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, options.max - currentCount));
        res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));

        if (currentCount > options.max) {
            res.status(429).json({
                success: false,
                error: {
                    code: options.code,
                    message: options.message,
                    requestId: (req as any).requestId || 'unknown',
                    timestamp: new Date().toISOString()
                }
            });
            return;
        }

        next();
    };
}

function runFallbackLimiter(key: string, options: RateLimitOptions, now: number): { count: number; resetTime: number } {
    let record = fallbackStore.get(key);

    if (!record || now > record.resetTime) {
        record = {
            count: 0,
            resetTime: now + options.windowMs
        };
    }

    record.count += 1;
    fallbackStore.set(key, record);
    return record;
}


// Separate rate limits configurations (configurable via environment variables)
export const authRateLimiter = createRateLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || '900000'), // 15 mins
    max: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '30'),
    message: 'Too many authentication attempts. Please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
});

export const walletRateLimiter = createRateLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_WALLET_WINDOW_MS || '900000'), // 15 mins
    max: parseInt(process.env.RATE_LIMIT_WALLET_MAX || '15'),
    message: 'Too many smart wallet creation requests. Please try again later.',
    code: 'WALLET_RATE_LIMIT_EXCEEDED'
});

export const deployRateLimiter = createRateLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_DEPLOY_WINDOW_MS || '900000'), // 15 mins
    max: parseInt(process.env.RATE_LIMIT_DEPLOY_MAX || '15'),
    message: 'Too many deployment requests. Please try again later.',
    code: 'DEPLOY_RATE_LIMIT_EXCEEDED'
});

export const sendTxRateLimiter = createRateLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_SEND_TX_WINDOW_MS || '900000'), // 15 mins
    max: parseInt(process.env.RATE_LIMIT_SEND_TX_MAX || '60'),
    message: 'Too many transaction submissions. Please try again later.',
    code: 'SEND_TX_RATE_LIMIT_EXCEEDED'
});

export const pollingRateLimiter = createRateLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_POLLING_WINDOW_MS || '60000'), // 1 min
    max: parseInt(process.env.RATE_LIMIT_POLLING_MAX || '120'),
    message: 'Too many transaction status polls. Please slow down.',
    code: 'POLLING_RATE_LIMIT_EXCEEDED'
});

export const healthRateLimiter = createRateLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_HEALTH_WINDOW_MS || '60000'), // 1 min
    max: parseInt(process.env.RATE_LIMIT_HEALTH_MAX || '60'),
    message: 'Too many health check requests.',
    code: 'HEALTH_RATE_LIMIT_EXCEEDED'
});
