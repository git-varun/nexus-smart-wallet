import {userRepository} from '../repositories';
import {AuthStatusResult, SessionValidationResult} from '../types';
import {config} from '../config/config';
import {createServiceLogger} from '../utils';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import {UserSessionModel, RevokedTokenModel} from '../models';
import {getRedisClient} from './redis.service';

const logger = createServiceLogger('AuthService');
const SALT_ROUNDS = 12;

/**
 * Generate JWT access token for user authentication (expires in 1 hour)
 */
export function generateAccessToken(userId: string, email?: string): string {
    const jwtSecret = config.security.jwtSecret;
    if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined in configuration');
    }

    const jti = crypto.randomUUID();
    return jwt.sign(
        {userId, email, jti},
        jwtSecret,
        {expiresIn: '1h'}
    );
}

/**
 * Generate standard JWT token (legacy support, maps to generateAccessToken)
 */
export function generateToken(userId: string, email?: string): string {
    return generateAccessToken(userId, email);
}

/**
 * Generate a random refresh token
 */
export function generateRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): { userId: string; email?: string; jti?: string } | null {
    try {
        const jwtSecret = config.security.jwtSecret;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not defined in configuration');
        }
        const decoded = jwt.verify(token, jwtSecret) as any;
        return {
            userId: decoded.userId,
            email: decoded.email,
            jti: decoded.jti
        };
    } catch (error) {
        logger.debug('JWT verification failed', error instanceof Error ? error.message : String(error));
        return null;
    }
}

/**
 * Hash a plain text password
 */
export async function hashPassword(plainTextPassword: string): Promise<string> {
    return bcrypt.hash(plainTextPassword, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hashed password
 */
export async function comparePassword(plainTextPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, hashedPassword);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): { isValid: boolean; message?: string } {
    if (password.length < 8) {
        return {isValid: false, message: 'Password must be at least 8 characters long'};
    }

    if (!/(?=.*[a-z])/.test(password)) {
        return {isValid: false, message: 'Password must contain at least one lowercase letter'};
    }

    if (!/(?=.*[A-Z])/.test(password)) {
        return {isValid: false, message: 'Password must contain at least one uppercase letter'};
    }

    if (!/(?=.*\d)/.test(password)) {
        return {isValid: false, message: 'Password must contain at least one number'};
    }

    if (!/(?=.*[!@#$%^&*])/.test(password)) {
        return {isValid: false, message: 'Password must contain at least one special character (!@#$%^&*)'};
    }

    return {isValid: true};
}

/**
 * Validate JWT token, check blacklist, and return user data
 */
export async function validateToken(token: string): Promise<SessionValidationResult> {
    try {
        const decoded = verifyToken(token);
        if (!decoded) {
            return {success: false, error: 'Invalid or expired token'};
        }

        const isRevoked = await isAccessTokenRevoked(token);
        if (isRevoked) {
            return {success: false, error: 'Token has been revoked or logged out'};
        }

        const user = await userRepository.findById(decoded.userId);
        if (!user) {
            return {success: false, error: 'User not found'};
        }

        return {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            }
        };
    } catch (error) {
        logger.error('Token validation failed', error instanceof Error ? error : new Error(String(error)));
        return {success: false, error: 'Token validation failed'};
    }
}

/**
 * Create a new user session for a device
 */
export async function createSession(
    userId: string,
    deviceIdentifier: string,
    userAgent?: string,
    ipAddress?: string
): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    // Revoke any existing active sessions on this device for the user (enforces single session per device)
    await UserSessionModel.updateMany(
        { userId, deviceIdentifier, isRevoked: false },
        { $set: { isRevoked: true } }
    );

    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days expiry

    const session = new UserSessionModel({
        userId,
        refreshToken,
        deviceIdentifier,
        userAgent,
        ipAddress,
        expiresAt,
        usedRefreshTokens: [],
        isRevoked: false
    });

    await session.save();

    const user = await userRepository.findById(userId);
    const accessToken = generateAccessToken(userId, user?.email);

    return { accessToken, refreshToken, expiresAt };
}

/**
 * Rotate a refresh token and return a new access/refresh pair
 */
export async function rotateSession(
    oldRefreshToken: string,
    userAgent?: string,
    ipAddress?: string
): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    const session = await UserSessionModel.findOne({ refreshToken: oldRefreshToken, isRevoked: false });

    if (!session) {
        // Replay detection: check if this refresh token was already rotated previously
        const replayedSession = await UserSessionModel.findOne({ usedRefreshTokens: oldRefreshToken });
        if (replayedSession) {
            logger.warn(`⚠️ Refresh token replay attack detected! Revoking all sessions for user ${replayedSession.userId}`);
            replayedSession.isRevoked = true;
            await replayedSession.save();
            await UserSessionModel.updateMany({ userId: replayedSession.userId }, { $set: { isRevoked: true } });
            throw new Error('Refresh token has been reused. All sessions revoked.');
        }
        throw new Error('Invalid or expired refresh token');
    }

    if (session.expiresAt.getTime() <= Date.now()) {
        session.isRevoked = true;
        await session.save();
        throw new Error('Refresh token has expired');
    }

    const newRefreshToken = generateRefreshToken();
    const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Extended by 30 days

    session.usedRefreshTokens.push(oldRefreshToken);
    session.refreshToken = newRefreshToken;
    session.expiresAt = newExpiresAt;
    if (userAgent) session.userAgent = userAgent;
    if (ipAddress) session.ipAddress = ipAddress;

    await session.save();

    const user = await userRepository.findById(session.userId.toString());
    const accessToken = generateAccessToken(session.userId.toString(), user?.email);

    return { accessToken, refreshToken: newRefreshToken, expiresAt: newExpiresAt };
}

/**
 * Revoke session by refresh token
 */
export async function revokeSession(refreshToken: string): Promise<boolean> {
    const result = await UserSessionModel.findOneAndUpdate(
        { refreshToken },
        { $set: { isRevoked: true } }
    );
    return !!result;
}

/**
 * Revoke all active sessions for a user (e.g. password change / security reset)
 */
export async function revokeAllUserSessions(userId: string): Promise<number> {
    const result = await UserSessionModel.updateMany(
        { userId, isRevoked: false },
        { $set: { isRevoked: true } }
    );
    return result.modifiedCount;
}

/**
 * Blacklist an access token upon logout / invalidation
 */
export async function blacklistAccessToken(token: string): Promise<void> {
    try {
        const decoded = jwt.decode(token) as any;
        const expiresAt = decoded && decoded.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Try Redis blacklist
        const redis = getRedisClient();
        if (redis) {
            const ttlSeconds = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 1000));
            if (ttlSeconds > 0) {
                await redis.set(`blacklist:${token}`, '1', 'EX', ttlSeconds);
                logger.debug('Token blacklisted in Redis');
                return;
            }
        }

        // Fallback/parallel store to MongoDB
        const revoked = new RevokedTokenModel({ token, expiresAt });
        await revoked.save();
        logger.debug('Token blacklisted in MongoDB');
    } catch (err) {
        logger.error('Failed to blacklist access token', err as Error);
    }
}

/**
 * Check if access token is blacklisted
 */
export async function isAccessTokenRevoked(token: string): Promise<boolean> {
    try {
        const redis = getRedisClient();
        if (redis) {
            const isBlacklisted = await redis.get(`blacklist:${token}`);
            if (isBlacklisted) return true;
        }

        const isRevoked = await RevokedTokenModel.exists({ token });
        return !!isRevoked;
    } catch (err) {
        logger.error('Failed to check token revocation status', err as Error);
        return false;
    }
}

/**
 * Logout user (Invalidate session + blacklist current access token)
 */
export async function logoutUser(accessToken?: string, refreshToken?: string): Promise<{ success: boolean }> {
    if (accessToken) {
        await blacklistAccessToken(accessToken);
    }
    if (refreshToken) {
        await revokeSession(refreshToken);
    }
    logger.info('User logout successful - session revoked and access token blacklisted');
    return {success: true};
}

/**
 * Get standard authentication status (no external dependencies)
 */
export async function getAuthStatus(token?: string): Promise<AuthStatusResult> {
    try {
        if (!token) {
            return {
                success: true,
                authenticated: false
            };
        }

        const tokenResult = await validateToken(token);
        if (!tokenResult.success || !tokenResult.user) {
            return {
                success: true,
                authenticated: false,
                error: tokenResult.error || 'User not found'
            };
        }

        // Fetch smart account details for auth status response if available
        let smartAccountAddress: string | undefined;
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { getAccountDetails } = require('./account.service');
            const accounts = await getAccountDetails(tokenResult.user.id);
            if (accounts && accounts.length > 0) {
                smartAccountAddress = accounts[0].address;
            }
        } catch {
            // Ignore error if account service fails/isn't deployed
        }

        return {
            success: true,
            authenticated: true,
            user: {
                id: tokenResult.user.id,
                email: tokenResult.user.email,
                createdAt: tokenResult.user.createdAt,
                lastLogin: tokenResult.user.lastLogin
            },
            smartAccountAddress
        };
    } catch (error) {
        logger.error('Get auth status failed', error instanceof Error ? error : new Error(String(error)));
        return {
            success: false,
            authenticated: false,
            error: 'Failed to get auth status'
        };
    }
}
