import {NextFunction, Request, Response} from 'express';
import {logger} from "../utils";
import {config} from '../config/config';

// Unified Application Error Class
export class AppError extends Error {
    constructor(
        public readonly code: string,
        public readonly message: string,
        public readonly statusCode: number = 400
    ) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
    const requestId = (req as any).requestId || 'unknown';
    const timestamp = new Date().toISOString();

    const statusCode = err.statusCode || 500;
    let code = err.code || 'INTERNAL_SERVER_ERROR';
    let message = err.message || 'Internal Server Error';

    // Log the error using structured logger
    logger.error('API Error Exception caught', err, undefined, { requestId });

    // Mask internal exceptions in production to prevent leaking implementation details
    if (statusCode === 500 && config.nodeEnv === 'production') {
        message = 'An unexpected internal server error occurred. Please contact support.';
        code = 'INTERNAL_SERVER_ERROR';
    }

    res.status(statusCode).json({
        success: false,
        error: {
            code,
            message,
            requestId,
            timestamp
        }
    });
}

export const errorHandlerMiddleware = errorHandler;
