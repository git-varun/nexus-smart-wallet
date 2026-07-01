import mongoose from "mongoose";
import {config} from "../config/config";
import {createServiceLogger, metrics} from "../utils";

const logger = createServiceLogger("Mongo");
let isConnected = false;

// Register global query metrics tracking plugin
mongoose.plugin((schema) => {
    schema.pre(['find', 'findOne', 'findOneAndUpdate', 'updateOne', 'deleteOne', 'countDocuments'], function(this: any) {
        this._startTime = Date.now();
    });
    schema.post(['find', 'findOne', 'findOneAndUpdate', 'updateOne', 'deleteOne', 'countDocuments'], function(this: any) {
        if (this._startTime) {
            const duration = Date.now() - this._startTime;
            metrics.trackDbQuery(duration);

            const threshold = Number(process.env.LOG_SLOW_DB_MS) || 250;
            if (duration > threshold) {
                const op = this.op;
                const collectionName = this.model?.collection?.name || this.model?.modelName || 'unknown';
                logger.warn(`Slow query ${collectionName}.${op} ${duration}ms`, {
                    model: collectionName,
                    operation: op,
                    durationMs: duration
                });
            }
        }
    });
});

mongoose.connection.on("reconnected", () => {
    logger.info("Reconnected");
});

/**
 * Initialize MongoDB connection (idempotent)
 */
export async function initializeDatabase(): Promise<void> {
    if (isConnected) return;

    try {
        await mongoose.connect(config.database.mongodb.uri);

        isConnected = true;

        logger.info("Connected");
    } catch (error) {
        logger.error("Connection failed", error as Error);
        throw error;
    }
}

/**
 * Close MongoDB connection (idempotent)
 */
export async function closeDatabase(): Promise<void> {
    if (!isConnected) return;

    try {
        await mongoose.disconnect();
        isConnected = false;

        logger.info("Disconnected");
    } catch (error) {
        logger.error("Disconnect failed", error as Error);
        throw error;
    }
}

/**
 * Check Database Connection Status
 */
export function getDatabaseStatus(): boolean {
    return mongoose.connection.readyState === 1;
}
