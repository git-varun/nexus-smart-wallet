import {createWriteStream, existsSync, mkdirSync} from 'fs';
import {join} from 'path';
import { AsyncLocalStorage } from 'async_hooks';

export interface LogContext {
    requestId?: string;
    transactionId?: string;
    userId?: string;
    accountId?: string;
    chainId?: number;
    workerId?: string;
    queueJobId?: string;
    idempotencyKey?: string;
}

export const logContextStorage = new AsyncLocalStorage<LogContext>();

export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}

export interface LogEntry {
    timestamp: string;
    level: string;
    service: string;
    message: string;
    data?: any;
    error?: Error;
    requestId?: string;
    userId?: string;
}

export class Logger {
    private static instance: Logger;
    private logLevel: LogLevel;
    private logStream: NodeJS.WritableStream | null = null;
    private logDir: string;

    private constructor() {
        this.logLevel = this.getLogLevelFromEnv();
        this.logDir = process.env.LOG_DIR || join(process.cwd(), 'logs');
        this.setupLogDirectory();
        this.setupLogStream();
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private getLogLevelFromEnv(): LogLevel {
        const envLogLevel = process.env.LOG_LEVEL?.toUpperCase();
        switch (envLogLevel) {
            case 'ERROR': return LogLevel.ERROR;
            case 'WARN': return LogLevel.WARN;
            case 'INFO': return LogLevel.INFO;
            case 'DEBUG': return LogLevel.DEBUG;
            default: return LogLevel.INFO;
        }
    }

    private setupLogDirectory(): void {
        if (!existsSync(this.logDir)) {
            mkdirSync(this.logDir, {recursive: true});
        }
    }

    private setupLogStream(): void {
        if (process.env.NODE_ENV !== 'test') {
            const logFileName = `app-${new Date().toISOString().split('T')[0]}.log`;
            const logFilePath = join(this.logDir, logFileName);
            this.logStream = createWriteStream(logFilePath, {flags: 'a'});
        }
    }

    private formatTimestamp(): string {
        return new Date().toISOString();
    }

    private formatConsoleTimestamp(): string {
        const d = new Date();
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        const ss = String(d.getSeconds()).padStart(2, '0');
        return `${hh}:${mm}:${ss}`;
    }

    private shouldLog(level: LogLevel): boolean {
        return level <= this.logLevel;
    }

    private sanitizeData(data: any): any {
        if (!data) return data;
        if (typeof data !== 'object') return data;
        
        try {
            const copy = JSON.parse(JSON.stringify(data));
            const sensitiveKeys = [
                'password', 'pass', 'privatekey', 'private_key', 'pkey', 'secret', 'token', 'authorization', 
                'jwt', 'apikey', 'api_key', 'mnemonic', 'cookie', 'refreshtoken', 'refresh_token', 'auth',
                'session', 'sessiontoken', 'session_token', 'rpcsecret', 'rpc_secret', 'recoveryphrase', 
                'recovery_phrase', 'recovery'
            ];
            
            const redact = (obj: any) => {
                for (const key in obj) {
                    const val = obj[key];
                    if (val && typeof val === 'object') {
                        redact(val);
                    } else if (typeof key === 'string' && sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
                        obj[key] = '[REDACTED]';
                    } else if (typeof val === 'string') {
                        if (val.startsWith('Bearer ') || val.includes('eyJhbGci')) {
                            obj[key] = '[REDACTED_TOKEN]';
                        } else if (/\b([a-z]{3,8}\s+){11,23}[a-z]{3,8}\b/.test(val)) {
                            obj[key] = '[REDACTED_MNEMONIC]';
                        }
                    }
                }
            };
            redact(copy);
            return copy;
        } catch {
            return '[UNSERIALIZABLE DATA]';
        }
    }

    private sanitizeMessage(message: string): string {
        if (typeof message !== 'string') return String(message);
        return message.replace(/0x[a-fA-F0-9]{64}/g, '[REDACTED_HEX_KEY]')
                      .replace(/\b([a-z]{3,8}\s+){11,23}[a-z]{3,8}\b/g, '[REDACTED_MNEMONIC]')
                      .replace(/Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g, 'Bearer [REDACTED_JWT]');
    }

    private writeLog(entry: LogEntry): void {
        const storeContext = logContextStorage.getStore() || {};
        const isJson = process.env.NODE_ENV === 'production' || process.env.LOG_FORMAT === 'json';
        const isDev = !isJson;

        const reqId = storeContext.requestId || entry.requestId;
        const shortReqId = reqId ? `req=${reqId.startsWith('req=') ? reqId.substring(4) : reqId.startsWith('req-') ? reqId.substring(4) : reqId}`.substring(0, 10) : '';

        // Prepare JSON log object
        const getEventName = (msg: string): string | undefined => {
            if (!msg) return undefined;
            const messageToEventMap: Record<string, string> = {
                'Wallet created': 'wallet_created',
                'Wallet deployed': 'wallet_deployed',
                'UserOperation submitted': 'user_operation_submitted',
                'Transaction confirmed': 'transaction_confirmed',
                'Transaction failed': 'transaction_failed',
                'Transaction queued': 'transaction_queued',
                'Transaction processing': 'transaction_processing',
                'Connected': 'connected',
                'Disconnected': 'disconnected',
                'Reconnected': 'reconnected',
                'Unavailable': 'unavailable',
                'Listening on': 'listening',
                'Ready': 'ready',
                'Starting': 'starting',
                'Shutdown initiated': 'shutdown_initiated',
                'Shutdown complete': 'shutdown_complete',
                'Stopped': 'stopped',
                'Started': 'started'
            };
            for (const [key, val] of Object.entries(messageToEventMap)) {
                if (msg.includes(key)) {
                    return val;
                }
            }
            return undefined;
        };

        const eventName = getEventName(entry.message);

        const logObj: any = {
            timestamp: entry.timestamp,
            level: entry.level.toLowerCase(),
            service: entry.service,
            event: eventName,
            message: this.sanitizeMessage(entry.message),
            requestId: reqId || undefined,
            transactionId: storeContext.transactionId || undefined,
            userId: storeContext.userId || entry.userId || undefined,
            accountId: storeContext.accountId || undefined,
            chainId: storeContext.chainId || undefined,
            workerId: storeContext.workerId || undefined,
            queueJobId: storeContext.queueJobId || undefined,
            idempotencyKey: storeContext.idempotencyKey || undefined
        };

        if (entry.error) {
            logObj.error = {
                message: entry.error.message,
                stack: (isDev || this.logLevel >= LogLevel.DEBUG) ? entry.error.stack : undefined
            };
            logObj.errorType = entry.error.name || 'Error';
            logObj.statusCode = (entry.error as any).statusCode || (entry.error as any).status || 500;
        }

        if (entry.data && typeof entry.data === 'object' && !Array.isArray(entry.data)) {
            const sanitized = this.sanitizeData(entry.data);
            for (const [key, val] of Object.entries(sanitized)) {
                if (key === 'duration' || key === 'durationMs') {
                    logObj.durationMs = val;
                } else if (logObj[key] === undefined) {
                    logObj[key] = val;
                }
            }
        } else if (entry.data !== undefined) {
            logObj.data = this.sanitizeData(entry.data);
        }

        // Bounded data size check
        if (logObj.data) {
            const str = typeof logObj.data === 'string' ? logObj.data : JSON.stringify(logObj.data);
            if (str.length > 10240) {
                logObj.data = '[TRUNCATED: payload exceeds 10KB limit]';
            }
        }

        if (isJson) {
            console.log(JSON.stringify(logObj));
        } else {
            // Human readable output
            const consoleTime = this.formatConsoleTimestamp();
            const servicePrefix = `[${entry.service}]`;
            
            let message = entry.message;
            if (entry.level === 'ERROR' && entry.error) {
                const errType = entry.error.name || 'Error';
                let errMsg = entry.error.message || entry.message;
                if (errMsg.startsWith(`${errType}:`)) {
                    errMsg = errMsg.substring(errType.length + 1).trim();
                } else if (errMsg.startsWith('Error:')) {
                    errMsg = errMsg.substring(6).trim();
                }
                const errStatus = (entry.error as any).statusCode || ((entry.error as any).statusCode === 0 ? 0 : (entry.error as any).status || (entry.data?.statusCode || (entry.data?.status || 500)));
                message = `${errType} ${errMsg} status=${errStatus}`;
            } else if (entry.error && !message.includes(entry.error.message)) {
                message += `: ${entry.error.message}`;
            }
            if (shortReqId && !message.includes(shortReqId)) {
                message += ` ${shortReqId}`;
            }

            const colorCode = entry.level === 'ERROR' ? '\x1b[31m' : entry.level === 'WARN' ? '\x1b[33m' : '';
            const reset = colorCode ? '\x1b[0m' : '';
            
            let consoleLine = `[${consoleTime}] ${servicePrefix} ${entry.level} ${message}`;
            if (colorCode) {
                consoleLine = `${colorCode}${consoleLine}${reset}`;
            }
            
            console.log(consoleLine);
            
            if (entry.level === 'ERROR' && entry.error) {
                if (this.logLevel >= LogLevel.DEBUG || isDev) {
                    if (entry.error.stack) {
                        console.error(colorCode ? `${colorCode}${entry.error.stack}${reset}` : entry.error.stack);
                    }
                }
            }
        }

        // File stream logging (always write structured JSON)
        if (this.logStream) {
            this.logStream.write(JSON.stringify(logObj) + '\n');
        }
    }

    public error(service: string, message: string, error?: Error, data?: any, context?: {
        requestId?: string;
        userId?: string
    }): void {
        if (!this.shouldLog(LogLevel.ERROR)) return;
        this.writeLog({
            timestamp: this.formatTimestamp(),
            level: 'ERROR',
            service,
            message,
            error,
            data,
            requestId: context?.requestId,
            userId: context?.userId
        });
    }

    public warn(service: string, message: string, data?: any, context?: { requestId?: string; userId?: string }): void {
        if (!this.shouldLog(LogLevel.WARN)) return;
        this.writeLog({
            timestamp: this.formatTimestamp(),
            level: 'WARN',
            service,
            message,
            data,
            requestId: context?.requestId,
            userId: context?.userId
        });
    }

    public info(service: string, message: string, data?: any, context?: { requestId?: string; userId?: string }): void {
        if (!this.shouldLog(LogLevel.INFO)) return;
        this.writeLog({
            timestamp: this.formatTimestamp(),
            level: 'INFO',
            service,
            message,
            data,
            requestId: context?.requestId,
            userId: context?.userId
        });
    }

    public debug(service: string, message: string, data?: any, context?: {
        requestId?: string;
        userId?: string
    }): void {
        if (!this.shouldLog(LogLevel.DEBUG)) return;
        this.writeLog({
            timestamp: this.formatTimestamp(),
            level: 'DEBUG',
            service,
            message,
            data,
            requestId: context?.requestId,
            userId: context?.userId
        });
    }

    public apiRequest(service: string, method: string, path: string, statusCode: number, duration: number, context?: {
        requestId?: string;
        userId?: string
    }): void {
        const level = statusCode >= 400 ? 'WARN' : 'INFO';
        const reqId = context?.requestId || logContextStorage.getStore()?.requestId;
        const shortReqId = reqId ? `req=${reqId.startsWith('req=') ? reqId.substring(4) : reqId.startsWith('req-') ? reqId.substring(4) : reqId}`.substring(0, 10) : '';
        const message = `${method} ${path} ${statusCode} ${duration}ms${shortReqId ? ' ' + shortReqId : ''}`;
        
        if (level === 'WARN') {
            this.warn(service, message, {method, path, statusCode, durationMs: duration}, context);
        } else {
            this.info(service, message, {method, path, statusCode, durationMs: duration}, context);
        }
    }

    public close(): void {
        if (this.logStream) {
            this.logStream.end();
        }
    }
}

export const logger = Logger.getInstance();

export const createServiceLogger = (serviceName: string) => {
    return {
        error: (message: string, error?: Error, data?: any, context?: { requestId?: string; userId?: string }) =>
            logger.error(serviceName, message, error, data, context),
        warn: (message: string, data?: any, context?: { requestId?: string; userId?: string }) =>
            logger.warn(serviceName, message, data, context),
        info: (message: string, data?: any, context?: { requestId?: string; userId?: string }) =>
            logger.info(serviceName, message, data, context),
        debug: (message: string, data?: any, context?: { requestId?: string; userId?: string }) =>
            logger.debug(serviceName, message, data, context)
    };
};

