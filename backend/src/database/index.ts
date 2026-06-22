import mongoose from "mongoose";
import {config} from "../config/config";
import {createServiceLogger, metrics} from "../utils";

const logger = createServiceLogger("Database Service");
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
        }
    });
});

/**
 * Initialize MongoDB connection (idempotent)
 */
export async function initializeDatabase(): Promise<void> {
    if (isConnected) return;

    try {
        logger.info("📡 Connecting to MongoDB...");

        await mongoose.connect(config.database.mongodb.uri);

        isConnected = true;

        logger.info("✅ MongoDB connected");
    } catch (error) {
        logger.error("❌ MongoDB connection failed:", error as Error);
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

        logger.info("🛑 MongoDB disconnected");
    } catch (error) {
        logger.error("❌ Error disconnecting MongoDB:", error as Error);
        throw error;
    }
}

/**
 * Check Database Connection Status
 */
export function getDatabaseStatus(): boolean {
    return mongoose.connection.readyState === 1;
}
