import { Request, Response } from "express";
import { createServiceLogger } from "../utils";

const logger = createServiceLogger("NotificationService");

interface Client {
    userId: string;
    res: Response;
}

class NotificationService {
    private clients: Client[] = [];

    public subscribe(userId: string, req: Request, res: Response): void {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();

        // Send a connected heartbeat event
        res.write(`data: ${JSON.stringify({ type: "connected", userId })}\n\n`);

        const client = { userId, res };
        this.clients.push(client);
        logger.info(`Client subscribed to notifications`, { userId, totalClients: this.clients.length });

        req.on("close", () => {
            this.clients = this.clients.filter(c => c.res !== res);
            logger.info(`Client unsubscribed from notifications`, { userId, totalClients: this.clients.length });
        });
    }

    public sendNotification(userId: string, eventType: string, payload: any): void {
        const message = {
            type: eventType,
            timestamp: new Date().toISOString(),
            payload
        };

        const targetClients = this.clients.filter(c => c.userId === userId);
        logger.info(`Sending notification to user`, { userId, eventType, matchingClients: targetClients.length });

        for (const client of targetClients) {
            try {
                client.res.write(`data: ${JSON.stringify(message)}\n\n`);
            } catch (err) {
                logger.error(`Error sending notification to client`, err as Error);
            }
        }
    }
}

export const notificationService = new NotificationService();
