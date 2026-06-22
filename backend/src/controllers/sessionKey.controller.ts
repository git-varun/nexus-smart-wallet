import { Response } from "express";
import { AuthenticatedRequest, getUserId } from "../middleware";
import { createServiceLogger } from "../utils";
import {
    createSessionKeyService,
    getSessionKeysService,
    revokeSessionKeyService,
    validateSessionKeyService
} from "../services/sessionKey.service";
import { sessionKeyRepository, accountRepository } from "../repositories";

const logger = createServiceLogger("SessionKeyController");

export async function createSessionKey(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Auth token is required" } });
            return;
        }

        const { ownerAddress, publicKey, chainId, permissions, expiresAt } = req.body;
        if (!ownerAddress || !publicKey || !chainId || !permissions) {
            res.status(400).json({ success: false, error: { code: "INVALID_INPUT", message: "Missing required session key parameter details" } });
            return;
        }

        // Authorize account ownership
        const account = await accountRepository.findAccountByAddress(ownerAddress);
        if (!account || account.userId !== userId) {
            res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "You do not own this smart account" } });
            return;
        }

        const result = await createSessionKeyService(
            userId,
            ownerAddress,
            publicKey,
            chainId,
            permissions,
            expiresAt
        );

        if (result.success) {
            logger.info("Audit Log: Session key created", { userId, publicKey, ownerAddress, chainId });
            res.status(201).json({ success: true, data: result.sessionKey });
        } else {
            res.status(400).json({ success: false, error: { code: "SESSION_KEY_CREATION_FAILED", message: result.error } });
        }
    } catch (err: any) {
        logger.error("Failed to create session key", err);
        res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: err.message } });
    }
}

export async function getSessionKeys(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Auth token is required" } });
            return;
        }

        const { ownerAddress, chainId } = req.query;
        if (!ownerAddress || !chainId) {
            res.status(400).json({ success: false, error: { code: "INVALID_INPUT", message: "ownerAddress and chainId queries are required" } });
            return;
        }

        const result = await getSessionKeysService(
            ownerAddress as string,
            parseInt(chainId as string)
        );

        if (result.success) {
            res.status(200).json({ success: true, data: result.data });
        } else {
            res.status(400).json({ success: false, error: { code: "SESSION_KEYS_RETRIEVAL_FAILED", message: result.error } });
        }
    } catch (err: any) {
        logger.error("Failed to fetch session keys", err);
        res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: err.message } });
    }
}

export async function revokeSessionKey(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Auth token is required" } });
            return;
        }

        const { publicKey } = req.body;
        if (!publicKey) {
            res.status(400).json({ success: false, error: { code: "INVALID_INPUT", message: "publicKey is required to revoke the session" } });
            return;
        }

        const result = await revokeSessionKeyService(publicKey);
        if (result.success) {
            res.status(200).json({ success: true, data: result.sessionKey });
        } else {
            res.status(400).json({ success: false, error: { code: "SESSION_REVOKE_FAILED", message: result.error } });
        }
    } catch (err: any) {
        logger.error("Failed to revoke session key", err);
        res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: err.message } });
    }
}

export async function validateSessionKey(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { publicKey, targetContract, functionSelector, value } = req.body;
        if (!publicKey || !targetContract || !functionSelector) {
            res.status(400).json({ success: false, error: { code: "INVALID_INPUT", message: "Missing parameter details to validate session key" } });
            return;
        }

        const txValue = value ? BigInt(value) : 0n;
        const result = await validateSessionKeyService(
            publicKey,
            targetContract,
            functionSelector,
            txValue
        );

        if (result.success) {
            res.status(200).json({ success: true, data: { isValid: result.isValid, error: result.error } });
        } else {
            res.status(400).json({ success: false, error: { code: "SESSION_VALIDATION_FAILED", message: result.error } });
        }
    } catch (err: any) {
        logger.error("Failed to validate session key", err);
        res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: err.message } });
    }
}

export async function getSessionKeysREST(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Auth token is required" } });
            return;
        }

        const { ownerAddress, chainId } = req.query;
        if (ownerAddress) {
            const account = await accountRepository.findAccountByAddress(ownerAddress as string);
            if (!account || account.userId !== userId) {
                res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "You do not own this smart account" } });
                return;
            }
        }

        const keys = await sessionKeyRepository.findSessionKeysByUser(userId, {
            ownerAddress: ownerAddress as string,
            chainId: chainId ? parseInt(chainId as string, 10) : undefined
        });

        logger.info("Audit Log: Fetched session keys list", { userId, count: keys.length });
        res.status(200).json({ success: true, data: keys });
    } catch (err: any) {
        logger.error("Failed to fetch session keys list", err);
        res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: err.message } });
    }
}

export async function getSessionKeyByIdREST(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Auth token is required" } });
            return;
        }

        const { id } = req.params;
        const idStr = typeof id === 'string' ? id : String(id);
        const sessionKey = await sessionKeyRepository.findSessionKeyByIdAndUser(idStr, userId);

        if (!sessionKey) {
            res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Session key not found" } });
            return;
        }

        logger.info("Audit Log: Retried specific session key details", { userId, keyId: idStr });
        res.status(200).json({ success: true, data: sessionKey });
    } catch (err: any) {
        logger.error("Failed to get session key details", err);
        res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: err.message } });
    }
}

export async function updateSessionKeyREST(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Auth token is required" } });
            return;
        }

        const { id } = req.params;
        const idStr = typeof id === 'string' ? id : String(id);
        const { permissions } = req.body;

        if (!permissions) {
            res.status(400).json({ success: false, error: { code: "INVALID_INPUT", message: "permissions field is required" } });
            return;
        }

        const sessionKey = await sessionKeyRepository.findSessionKeyByIdAndUser(idStr, userId);
        if (!sessionKey) {
            res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Session key not found or not owned by you" } });
            return;
        }

        const updated = await sessionKeyRepository.updateSessionKeyPermissions(sessionKey.id, permissions);
        logger.info("Audit Log: Session key permissions updated", { userId, keyId: idStr });
        res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
        logger.error("Failed to update session key permissions", err);
        res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: err.message } });
    }
}

export async function deleteSessionKeyREST(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Auth token is required" } });
            return;
        }

        const { id } = req.params;
        const idStr = typeof id === 'string' ? id : String(id);
        const sessionKey = await sessionKeyRepository.findSessionKeyByIdAndUser(idStr, userId);
        if (!sessionKey) {
            res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Session key not found or not owned by you" } });
            return;
        }

        const revoked = await sessionKeyRepository.deleteSessionKeyByIdAndUser(idStr, userId);
        logger.info("Audit Log: Session key revoked", { userId, keyId: idStr, publicKey: sessionKey.publicKey });
        res.status(200).json({ success: true, data: revoked });
    } catch (err: any) {
        logger.error("Failed to delete/revoke session key", err);
        res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: err.message } });
    }
}
