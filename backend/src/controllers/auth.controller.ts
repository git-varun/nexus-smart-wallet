import {Request, Response} from 'express';
import {z} from 'zod';
import {
    comparePassword,
    getAuthStatus,
    logoutUser,
    validatePasswordStrength,
    createSession,
    rotateSession
} from '../services/auth.service';
import {createServiceLogger} from '../utils';
import * as UserRepository from '../repositories/userRepository';
import {createUser} from "../services/user.service";
import crypto from 'crypto';
import {UserSessionModel} from '../models';
import {AuthenticatedRequest} from '../types/api';

const logger = createServiceLogger('AuthController');

// Helper to extract device info
function getDeviceInfo(req: Request) {
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const deviceIdentifier = req.body.deviceIdentifier || 
                             req.header('X-Device-ID') || 
                             crypto.createHash('md5').update(userAgent + ipAddress).digest('hex');
    return { deviceIdentifier, userAgent, ipAddress };
}

// Register new user with email and password
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const {email, password} = req.body;

        // Validate input
        if (!email || !password) {
            logger.warn(`Missing fields during registration. Email: ${!!email}, Password: ${!!password}`);
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING FIELDS',
                    message: 'Email and password are required'
                }
            });
            return;
        }

        // Validate email format
        if (!z.email().safeParse(email).success) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_EMAIL',
                    message: 'Invalid email format'
                }
            });
            return;
        }

        // Validate password strength
        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.isValid) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'WEAK PASSWORD',
                    message: passwordValidation.message
                }
            });
            return;
        }

        const result = await createUser(email, password);

        if (!result.success) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'REGISTRATION_FAILED',
                    message: result.error || 'Failed to create user'
                }
            });
            return;
        }

        // Create new session
        const { deviceIdentifier, userAgent, ipAddress } = getDeviceInfo(req);
        const session = await createSession(result.user!.id, deviceIdentifier, userAgent, ipAddress);

        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: result.user?.id,
                    email: result.user?.email,
                    createdAt: result.user?.createdAt
                },
                token: session.accessToken,
                refreshToken: session.refreshToken,
                expiresAt: session.expiresAt
            }
        });

    } catch (error) {
        logger.error('User registration failed', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Registration failed'
            }
        });
    }
};

// Authenticate user using centralized wallet system
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const {email, password} = req.body;

        const user = await UserRepository.findByEmail(email);
        // Validate input
        if (!user) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'user does not exist',
                }
            });
            return;
        }

        // Validate password
        const isValidPassword = await comparePassword(password, user.password || '');

        if (isValidPassword) {
            // Update last login
            await UserRepository.updateLastLogin(user.id);

            // Create new session
            const { deviceIdentifier, userAgent, ipAddress } = getDeviceInfo(req);
            const session = await createSession(user.id, deviceIdentifier, userAgent, ipAddress);

            res.status(200).json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        createdAt: user.createdAt,
                        lastLogin: user.lastLogin
                    },
                    token: session.accessToken,
                    refreshToken: session.refreshToken,
                    expiresAt: session.expiresAt
                }
            });
        } else {
            res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password'
                }
            });
        }

    } catch (error) {
        logger.error('Centralized wallet authentication failed', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Authentication failed'
            }
        });
    }
};

// Refresh access token using refresh token
export const refresh = async (req: Request, res: Response): Promise<void> => {
    try {
        const {refreshToken} = req.body;
        const {userAgent, ipAddress} = getDeviceInfo(req);

        const session = await rotateSession(refreshToken, userAgent, ipAddress);

        res.status(200).json({
            success: true,
            data: {
                token: session.accessToken,
                refreshToken: session.refreshToken,
                expiresAt: session.expiresAt
            }
        });
    } catch (error: any) {
        logger.error('Session rotation failed', error);
        res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_REFRESH_TOKEN',
                message: error.message || 'Refresh failed'
            }
        });
    }
};

// Logout user (Invalidate session + blacklist access token)
export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const accessToken = authHeader && authHeader.split(' ')[1];
        const {refreshToken} = req.body;

        await logoutUser(accessToken, refreshToken);

        res.status(200).json({
            success: true,
            message: 'Logged out successfully. Tokens invalidated.'
        });

    } catch (error) {
        logger.error('Logout failed', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Logout failed'
            }
        });
    }
};

// Get active sessions for logged-in user
export const getSessions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({success: false, error: 'Unauthorized'});
            return;
        }

        const sessions = await UserSessionModel.find({userId, isRevoked: false}).sort({updatedAt: -1});

        res.status(200).json({
            success: true,
            data: sessions.map(s => ({
                id: s.id,
                deviceIdentifier: s.deviceIdentifier,
                userAgent: s.userAgent,
                ipAddress: s.ipAddress,
                expiresAt: s.expiresAt,
                lastActive: s.updatedAt
            }))
        });
    } catch (error) {
        logger.error('Failed to get active sessions', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to retrieve sessions'
            }
        });
    }
};

// Revoke a specific session
export const revokeSessionEndpoint = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const {refreshToken} = req.body;

        if (!userId) {
            res.status(401).json({success: false, error: 'Unauthorized'});
            return;
        }

        const session = await UserSessionModel.findOne({refreshToken, userId});
        if (!session) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'SESSION_NOT_FOUND',
                    message: 'Session not found or belongs to another user'
                }
            });
            return;
        }

        session.isRevoked = true;
        await session.save();

        res.status(200).json({
            success: true,
            message: 'Session revoked successfully'
        });
    } catch (error) {
        logger.error('Failed to revoke session', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to revoke session'
            }
        });
    }
};

// Get authentication status
export const getStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            res.status(200).json({
                success: true,
                data: {
                    authenticated: false
                }
            });
            return;
        }

        const result = await getAuthStatus(token);

        res.status(200).json({
            success: true,
            data: {
                authenticated: result.authenticated,
                user: result.user,
                smartAccountAddress: result.smartAccountAddress
            }
        });

    } catch (error) {
        logger.error('Get auth status failed', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to get authentication status'
            }
        });
    }
};
