import Redis from "ioredis";
import { config } from "../config/config";
import { createServiceLogger, metrics } from "../utils";

const logger = createServiceLogger("Redis");

let redisClient: Redis | null = null;
let redisConnected = false;
let redisWasConnected = false;

export function initializeRedis(): Redis | null {
    if (!config.redis.enabled) {
        logger.debug("Redis is disabled in configuration.");
        return null;
    }

    if (redisClient) return redisClient;

    try {
        redisClient = new Redis(config.redis.uri, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => {
                const delay = Math.min(times * 200, 5000);
                logger.warn(`Redis reconnect attempt ${times}`);
                return delay;
            }
        });

        // Wrap for slow command detection and latency tracking
        const wrapCommand = (client: Redis, commandName: string) => {
            const original = (client as any)[commandName];
            if (typeof original !== 'function') return;
            (client as any)[commandName] = async function(...args: any[]) {
                const start = Date.now();
                try {
                    return await original.apply(this, args);
                } finally {
                    const duration = Date.now() - start;
                    metrics.trackRedisCall(duration);
                    
                    const threshold = Number(process.env.LOG_SLOW_REDIS_MS) || 100;
                    if (duration > threshold) {
                        logger.warn(`Slow ${commandName.toUpperCase()} ${duration}ms`, {
                            command: commandName.toUpperCase(),
                            durationMs: duration
                        });
                    }
                }
            };
        };

        const slowRedisCommands = ['get', 'set', 'eval', 'evalsha'];
        for (const cmd of slowRedisCommands) {
            wrapCommand(redisClient, cmd);
        }

        redisClient.on("connect", () => {
            if (redisWasConnected) {
                logger.info("Reconnected");
            } else {
                logger.info("Connected");
                redisWasConnected = true;
            }
            redisConnected = true;
        });

        redisClient.on("error", (error) => {
            redisConnected = false;
            logger.error("Unavailable", error instanceof Error ? error : new Error(String(error)));
        });

        redisClient.on("close", () => {
            redisConnected = false;
            logger.info("Disconnected");
        });
    } catch (err) {
        redisConnected = false;
        logger.error("Unavailable", err instanceof Error ? err : new Error(String(err)));
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
        logger.info("Disconnected");
    }
}
