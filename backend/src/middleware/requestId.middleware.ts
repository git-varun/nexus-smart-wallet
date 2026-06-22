import {Request, Response, NextFunction} from 'express';
import crypto from 'crypto';
import { logContextStorage } from '../utils/logger';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
    const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
    (req as any).requestId = requestId;
    res.setHeader('X-Request-ID', requestId);

    const idempotencyKey = (req.headers['idempotency-key'] || req.body?.idempotencyKey) as string;

    // Build log context object
    const context = {
        requestId,
        idempotencyKey,
        userId: undefined,
        accountId: undefined,
        chainId: undefined
    };

    logContextStorage.run(context, () => {
        next();
    });
}
