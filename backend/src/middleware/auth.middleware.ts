import {NextFunction, Response} from 'express';
import {AuthenticatedRequest} from '../types';
import {validateToken} from '../services/auth.service';

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({success: false, error: 'Authentication required'});
        return;
    }

    const tokenResult = await validateToken(token);
    if (!tokenResult.success || !tokenResult.user) {
        res.status(401).json({success: false, error: 'Invalid token'});
        return;
    }

    req.user = {
        id: tokenResult.user.id,
        email: tokenResult.user.email || ''
    };

    // Update log context with user ID
    const { logContextStorage } = require('../utils/logger');
    const store = logContextStorage.getStore();
    if (store) {
        store.userId = tokenResult.user.id;
    }

    next();
}

export function getUserId(req: AuthenticatedRequest): string | null {
    return req.user?.id || null;
}
