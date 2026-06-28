import { Response } from "express";
import { AuthenticatedRequest, getUserId } from "../middleware";
import { createServiceLogger, getCentralAccount } from "../utils";
import {
    createSessionKeyService,
    getSessionKeysService,
    revokeSessionKeyService,
    validateSessionKeyService
} from "../services/sessionKey.service";
import { accountRepository } from "../repositories";
import { verifyMessage } from "viem";
import { custodialSigner } from "../services/signer.service";

const logger = createServiceLogger("SessionKeyController");

export async function createSessionKey(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Auth token is required" } });
            return;
        }

        const { ownerAddress, publicKey, chainId, permissions, expiresAt, signature } = req.body;
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

        // Cryptographic Signature verification & Replay / Chain check
        const expectedSigner = (account.signerAddress && account.signerAddress !== 'CENTRAL_WALLET')
            ? account.signerAddress
            : await custodialSigner.getAddress();

        const message = `Register session key: ${publicKey.toLowerCase()}\nOwner: ${ownerAddress.toLowerCase()}\nChain ID: ${chainId}\nExpires At: ${expiresAt || 'Never'}`;

        let signatureToSave = signature;

        if (signature) {
            const isValid = await verifyMessage({
                address: expectedSigner as `0x${string}`,
                message,
                signature
            }).catch(() => false);

            if (!isValid) {
                res.status(400).json({ success: false, error: { code: "INVALID_SIGNATURE", message: "Owner cryptographic signature verification failed" } });
                return;
            }
        } else {
            // Under custodial wallet setup, if central wallet is owner, sign message on behalf of user
            if (account.signerAddress === 'CENTRAL_WALLET' || !account.signerAddress) {
                const centralAccount = await getCentralAccount();
                signatureToSave = await centralAccount.signMessage({ message });
            } else {
                res.status(400).json({ success: false, error: { code: "SIGNATURE_REQUIRED", message: "Cryptographic signature from the owner is required" } });
                return;
            }
        }

        const result = await createSessionKeyService(
            userId,
            ownerAddress,
            publicKey,
            chainId,
            permissions,
            expiresAt,
            signatureToSave
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


