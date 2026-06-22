import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/config";
import { notificationService } from "../services/notification.service";
import { getUserId } from "../middleware";
import { createServiceLogger } from "../utils";

const logger = createServiceLogger("NotificationController");

export async function subscribeNotifications(req: Request, res: Response): Promise<void> {
    try {
        let userId = getUserId(req as any);

        // Standard EventSource doesn't support authorization headers, so support JWT in query token parameter
        const queryToken = req.query.token as string;
        if (!userId && queryToken) {
            try {
                const decoded = jwt.verify(queryToken, config.security.jwtSecret) as { userId: string };
                userId = decoded.userId;
            } catch (err) {
                logger.warn("SSE JWT subscription verification failed", { error: (err as Error).message });
                res.status(401).json({
                    success: false,
                    error: { code: "UNAUTHORIZED", message: "Invalid or expired notification token" }
                });
                return;
            }
        }

        if (!userId) {
            res.status(401).json({
                success: false,
                error: { code: "UNAUTHORIZED", message: "User authentication required" }
            });
            return;
        }

        notificationService.subscribe(userId, req, res);
    } catch (error) {
        logger.error("Failed notification subscription connection setup", error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: { code: "INTERNAL_ERROR", message: "Failed to setup notification connection" }
        });
    }
}
