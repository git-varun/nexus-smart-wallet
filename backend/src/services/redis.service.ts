import Redis from "ioredis";
import { config } from "../config/config";
import { createServiceLogger } from "../utils/logger";

const logger = createServiceLogger("RedisService");

let redisClient: Redis | null = null;
let redisConnected = false;

export function initializeRedis(): Redis | null {
    if (!config.redis.enabled) {
        logger.info("Redis is disabled in configuration.");
        return null;
    }

    if (redisClient) return redisClient;

    logger.info("🔌 Connecting to Redis...");
    
    try {
        redisClient = new Redis(config.redis.uri, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => {
                const delay = Math.min(times * 200, 5000);
                logger.warn(`Redis connection retry attempt ${times} after ${delay}ms`);
                return delay;
            }
        });

        redisClient.on("connect", () => {
            redisConnected = true;
            logger.info("✅ Redis connected successfully");
        });

        redisClient.on("error", (error) => {
            redisConnected = false;
            logger.error("❌ Redis connection error:", error);
        });

        redisClient.on("close", () => {
            redisConnected = false;
            logger.warn("🛑 Redis connection closed");
        });
    } catch (err) {
        redisConnected = false;
        logger.error("❌ Failed to instantiate Redis client:", err instanceof Error ? err : new Error(String(err)));
    }

    return redisClient;
}

export function getRedisClient(): Redis | null {
    if (!redisClient && config.redis.enabled) {
        initializeRedis();
    }
    return redisConnected ? redisClient : null;
}

export function isRedisAvailable(): boolean {
    return config.redis.enabled && redisConnected;
}

export async function closeRedis(): Promise<void> {
    if (redisClient) {
        try {
            await redisClient.quit();
        } catch {
            redisClient.disconnect();
        }
        redisClient = null;
        redisConnected = false;
        logger.info("🛑 Redis disconnected");
    }
}
