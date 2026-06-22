import { sessionKeyRepository } from "../repositories";
import { ISessionKey, ISessionPermission } from "../models";
import { createServiceLogger } from "../utils";
import { notificationService } from "./notification.service";

const logger = createServiceLogger("SessionKeyService");

export async function createSessionKeyService(
    userId: string,
    ownerAddress: string,
    publicKey: string,
    chainId: number,
    permissions: ISessionPermission[],
    expiresAtStr?: string
): Promise<{ success: boolean; sessionKey?: ISessionKey; error?: string }> {
    try {
        const expiresAt = expiresAtStr ? new Date(expiresAtStr) : new Date(Date.now() + 24 * 60 * 60 * 1000); // default 24h
        if (expiresAt.getTime() <= Date.now()) {
            return { success: false, error: "Expiration time must be in the future" };
        }

        // Check if session key already exists
        const existing = await sessionKeyRepository.findSessionKeyByPublicKey(publicKey);
        if (existing) {
            return { success: false, error: "Session key already registered" };
        }

        const sessionKey = await sessionKeyRepository.createSessionKey({
            userId,
            ownerAddress: ownerAddress.toLowerCase(),
            publicKey: publicKey.toLowerCase(),
            chainId,
            permissions,
            expiresAt,
            isActive: true
        });

        logger.info("Session key registered", { id: sessionKey.id, publicKey });
        return { success: true, sessionKey };
    } catch (err: any) {
        logger.error("Failed to register session key", err);
        return { success: false, error: err.message || "Failed to register session key" };
    }
}

export async function getSessionKeysService(
    ownerAddress: string,
    chainId: number
): Promise<{ success: boolean; data?: ISessionKey[]; error?: string }> {
    try {
        const keys = await sessionKeyRepository.findSessionKeysByOwner(ownerAddress, chainId);
        return { success: true, data: keys };
    } catch (err: any) {
        logger.error("Failed to list session keys", err);
        return { success: false, error: err.message };
    }
}

export async function revokeSessionKeyService(
    publicKey: string
): Promise<{ success: boolean; sessionKey?: ISessionKey; error?: string }> {
    try {
        const sessionKey = await sessionKeyRepository.revokeSessionKey(publicKey);
        if (!sessionKey) {
            return { success: false, error: "Session key not found" };
        }
        logger.info("Session key revoked successfully", { publicKey });
        return { success: true, sessionKey };
    } catch (err: any) {
        logger.error("Failed to revoke session key", err);
        return { success: false, error: err.message };
    }
}

export async function validateSessionKeyService(
    publicKey: string,
    targetContract: string,
    functionSelector: string,
    value: bigint
): Promise<{ success: boolean; isValid: boolean; error?: string }> {
    try {
        const sessionKey = await sessionKeyRepository.findSessionKeyByPublicKey(publicKey);
        if (!sessionKey) {
            return { success: false, isValid: false, error: "Session key not found or unregistered" };
        }

        if (!sessionKey.isActive) {
            return { success: true, isValid: false, error: "Session key is inactive or revoked" };
        }

        // Check expiration
        if (sessionKey.expiresAt.getTime() <= Date.now()) {
            // Update state to inactive dynamically (autoclean/lazy evaluation)
            sessionKey.isActive = false;
            await sessionKey.save();
            notificationService.sendNotification(sessionKey.userId, "session.expired", {
                publicKey: sessionKey.publicKey,
                expiresAt: sessionKey.expiresAt
            });
            return { success: true, isValid: false, error: "Session key has expired" };
        }

        // Validate target contract and function permissions
        const matchingPermission = sessionKey.permissions.find(p => p.target.toLowerCase() === targetContract.toLowerCase());
        if (!matchingPermission) {
            return { success: true, isValid: false, error: `Contract ${targetContract} is not in the allowlist` };
        }

        // Validate allowed functions
        // Wildcard '*' is supported, or exact match
        const isFunctionAllowed = matchingPermission.allowedFunctions.includes("*") || 
            matchingPermission.allowedFunctions.includes(functionSelector) ||
            matchingPermission.allowedFunctions.some(f => f.toLowerCase() === functionSelector.toLowerCase());

        if (!isFunctionAllowed) {
            return { success: true, isValid: false, error: `Function ${functionSelector} is not permitted for this contract` };
        }

        // Validate spending limits
        const limit = BigInt(matchingPermission.spendingLimit || "0");
        if (limit > 0n && value > limit) {
            return { success: true, isValid: false, error: `Transaction value ${value} exceeds the session spending limit of ${limit}` };
        }

        return { success: true, isValid: true };
    } catch (err: any) {
        logger.error("Failed to validate session key", err);
        return { success: false, isValid: false, error: err.message };
    }
}
