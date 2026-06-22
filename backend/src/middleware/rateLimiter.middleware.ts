import {Request, Response, NextFunction} from 'express';
import {config} from '../config/config';

interface RateLimitStoreEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitStoreEntry>();

interface RateLimitOptions {
    windowMs: number;
    max: number;
    message: string;
    code: string;
}

export function createRateLimiter(options: RateLimitOptions) {
    return (req: Request, res: Response, next: NextFunction): void => {
        // Skip rate limit in test environment unless explicitly needed
        if (config.nodeEnv === 'test') {
            next();
            return;
        }

        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const key = `${req.baseUrl || ''}${req.path}:${ip}`;
        const now = Date.now();

        let record = rateLimitStore.get(key);

        if (!record || now > record.resetTime) {
            record = {
                count: 0,
                resetTime: now + options.windowMs
            };
        }

        record.count += 1;
        rateLimitStore.set(key, record);

        res.setHeader('X-RateLimit-Limit', options.max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, options.max - record.count));
        res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

        if (record.count > options.max) {
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
