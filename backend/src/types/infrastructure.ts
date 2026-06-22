import {Document} from 'mongoose';
import {Session} from './domain';


export interface SessionDocument extends Omit<Session, 'id'>, Document {
    _id: any;
}

// Database connection configuration
export interface ConnectionOptions {
    uri: string;
    dbName: string;
    fallbackToMemory?: boolean;
    dualWrite?: boolean;
}

// Logger types
export interface LogEntry {
    timestamp: string;
    level: string;
    service: string;
    message: string;
    data?: any;
    error?: Error;
    stack?: string;
    requestId?: string;
    userId?: string;
}

// Configuration types
export interface Config {
    port: number;
    nodeEnv: string;
    corsOrigins: string[];
    alchemy: {
        apiKey: string;
        policyId?: string;
        chainId: number;
        entryPointAddress: string;
        factoryAddress: string;
    };
    database: {
        useDatabase: boolean;
        mongodbUri?: string;
        mongodbDbName: string;
        fallbackToMemory: boolean;
        dualWrite: boolean;
    };
    security: {
        jwtSecret: string;
        sessionExpiryHours: number;
        tokenLength: number;
    };
}
