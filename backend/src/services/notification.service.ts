import { Request, Response } from "express";
import { createServiceLogger } from "../utils";
import { config } from "../config/config";
import { getRedisClient, isRedisAvailable } from "./redis.service";
import Redis from "ioredis";
import { NotificationEventModel } from "../models";

const logger = createServiceLogger("NotificationService");
const REDIS_CHANNEL = "notifications:publish";

interface Client {
    userId: string;
    res: Response;
    lastSeen: number;
}

class NotificationService {
    private clients: Client[] = [];
    private subClient: Redis | null = null;
    private initializedSub = false;
    private heartbeatInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.initializeRedisSubscription();
        this.startHeartbeatTimer();
    }

    private initializeRedisSubscription() {
        if (!config.redis.enabled || this.initializedSub) return;

        try {
            logger.info("Initializing Redis Pub/Sub subscriber client...");
            this.subClient = new Redis(config.redis.uri, {
                maxRetriesPerRequest: null,
                retryStrategy: (times) => Math.min(times * 100, 3000)
            });

            this.subClient.on("ready", async () => {
                logger.info("✅ Redis Notification Subscriber ready and listening");
                try {
                    await this.subClient!.subscribe(REDIS_CHANNEL);
                    logger.info(`Subscribed to Redis channel: ${REDIS_CHANNEL}`);
                } catch (err) {
                    logger.error(`Failed to subscribe to Redis channel ${REDIS_CHANNEL}:`, err as Error);
                }
            });

            this.subClient.on("message", (channel, message) => {
                if (channel === REDIS_CHANNEL) {
                    try {
                        const { userId, eventType, payload, eventId } = JSON.parse(message);
                        this.sendLocalNotification(userId, eventType, payload, eventId);
                    } catch (err) {
                        logger.error("Failed to parse Redis notification message:", err as Error);
                    }
                }
            });

            this.subClient.on("error", (error) => {
                logger.error("❌ Redis Notification Subscriber error:", error);
            });

            this.initializedSub = true;
        } catch (err) {
            logger.error("❌ Failed to initialize Redis notification subscriber:", err as Error);
        }
    }

    private startHeartbeatTimer() {
        // Send heartbeat comment or ping message every 15 seconds to detect dead connections and prevent timeouts
        this.heartbeatInterval = setInterval(() => {
            const deadClients: Client[] = [];
            const now = Date.now();

            for (const client of this.clients) {
                try {
                    // Send a structured heartbeat event
                    client.res.write(`event: heartbeat\ndata: ${JSON.stringify({ type: "heartbeat", timestamp: new Date().toISOString() })}\n\n`);
                    client.lastSeen = now;
                } catch {
                    logger.warn(`Stale SSE connection detected for user ${client.userId}. Cleaning up...`);
                    deadClients.push(client);
                }
            }

            if (deadClients.length > 0) {
                this.clients = this.clients.filter(c => !deadClients.includes(c));
                logger.info(`Cleaned up ${deadClients.length} orphaned/stale SSE connections. Active remaining: ${this.clients.length}`);
            }
        }, 15000);
    }

    public async subscribe(userId: string, req: Request, res: Response): Promise<void> {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();

        const client: Client = { userId, res, lastSeen: Date.now() };
        this.clients.push(client);
        logger.info(`Client subscribed to notifications`, { userId, totalClients: this.clients.length });

        // Send a connected confirmation event
        res.write(`event: connected\ndata: ${JSON.stringify({ type: "connected", userId })}\n\n`);

        // Missed-event recovery (Event Replay Support)
        // Check Last-Event-ID header or lastEventId query parameter
        const lastEventId = (req.headers["last-event-id"] || req.query.lastEventId) as string;
        if (lastEventId) {
            try {
                // Parse timestamp from event ID (format: ISOString-random)
                const parts = lastEventId.split('-');
                if (parts.length > 0) {
                    const lastEventDate = new Date(parts[0]);
                    if (!isNaN(lastEventDate.getTime())) {
                        const missedEvents = await NotificationEventModel.find({
                            userId,
                            timestamp: { $gt: lastEventDate }
                        }).sort({ timestamp: 1 });

                        if (missedEvents.length > 0) {
                            logger.info(`Replaying ${missedEvents.length} missed events for user ${userId} since ${lastEventId}`);
                            for (const event of missedEvents) {
                                res.write(`id: ${event.eventId}\nevent: message\ndata: ${JSON.stringify({
                                    id: event.eventId,
                                    type: event.type,
                                    timestamp: event.timestamp.toISOString(),
                                    payload: event.payload
                                })}\n\n`);
                            }
                        }
                    }
                }
            } catch (err) {
                logger.error("Failed to replay missed events for subscriber", err as Error);
            }
        }

        // Lazy sub initialization helper in case Redis wasn't ready
        if (config.redis.enabled && !this.initializedSub) {
            this.initializeRedisSubscription();
        }

        req.on("close", () => {
            this.clients = this.clients.filter(c => c.res !== res);
            logger.info(`Client unsubscribed from notifications`, { userId, totalClients: this.clients.length });
        });
    }

    public async sendNotification(userId: string, eventType: string, payload: any): Promise<void> {
        // Save the event to MongoDB first to ensure it's available for replay
        const eventId = new Date().toISOString() + '-' + crypto.randomUUID().substring(0, 8);
        try {
            const eventDoc = new NotificationEventModel({
                userId,
                eventId,
                type: eventType,
                payload,
                timestamp: new Date()
            });
            await eventDoc.save();
        } catch (err) {
            logger.error("Failed to persist notification event for replay", err as Error);
        }

        const messagePayload = { userId, eventType, payload, eventId };

        const redis = getRedisClient();
        if (redis && isRedisAvailable()) {
            try {
                redis.publish(REDIS_CHANNEL, JSON.stringify(messagePayload));
                logger.debug("Published notification to Redis channel", { userId, eventType });
                return;
            } catch (err) {
                logger.error("Failed to publish notification to Redis, falling back to local delivery:", err as Error);
            }
        }

        // Fallback local delivery
        this.sendLocalNotification(userId, eventType, payload, eventId);
    }

    private sendLocalNotification(userId: string, eventType: string, payload: any, eventId: string): void {
        const message = {
            id: eventId,
            type: eventType,
            timestamp: new Date().toISOString(),
            payload
        };

        const targetClients = this.clients.filter(c => c.userId === userId);
        logger.info(`Sending local notification to user`, { userId, eventType, matchingClients: targetClients.length });

        for (const client of targetClients) {
            try {
                client.res.write(`id: ${eventId}\nevent: message\ndata: ${JSON.stringify(message)}\n\n`);
            } catch (err) {
                logger.error(`Error writing notification to local SSE client socket`, err as Error);
            }
        }
    }

    public async shutdown(): Promise<void> {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        if (this.subClient) {
            await this.subClient.quit().catch(() => this.subClient?.disconnect());
            this.subClient = null;
            this.initializedSub = false;
            logger.info("🛑 Redis Notification Subscriber shutdown complete");
        }
    }
}

export const notificationService = new NotificationService();
