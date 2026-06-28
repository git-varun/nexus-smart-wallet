import {Request, Response, NextFunction} from 'express';
import {z, ZodError} from 'zod';
import {SUPPORTED_WALLETS, SUPPORTED_PAYMASTER, SUPPORTED_BUNDLER} from '../config/config';

// Custom validations
const ethAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
    message: "Invalid Ethereum address format (must start with 0x and be 42 characters long)"
});

const hexDataSchema = z.string().regex(/^0x[a-fA-F0-9]*$/, {
    message: "Invalid hex data format (must start with 0x followed by hex characters)"
});

const userOpHashSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/, {
    message: "Invalid UserOperation hash format (must be 0x followed by 64 hex characters)"
});

// Schemas matching the API endpoints
export const registerSchema = z.object({
    email: z.string().email('Invalid email address format'),
    password: z.string().min(8, 'Password must be at least 8 characters long')
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address format'),
    password: z.string().min(1, 'Password is required')
});

export const refreshSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
    deviceIdentifier: z.string().optional()
});

export const revokeSessionSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required')
});

export const createAccountSchema = z.object({
    chainId: z.number().positive('Chain ID must be a positive integer'),
    walletID: z.enum(SUPPORTED_WALLETS as [string, ...string[]], {
        message: `Wallet ID must be one of: ${SUPPORTED_WALLETS.join(', ')}`
    }),
    accountType: z.string().min(1, 'Account type is required')
});

export const deployAccountSchema = z.object({
    chainId: z.number().positive('Chain ID must be a positive integer'),
    walletID: z.enum(SUPPORTED_WALLETS as [string, ...string[]], {
        message: `Wallet ID must be one of: ${SUPPORTED_WALLETS.join(', ')}`
    }),
    paymasterID: z.enum(SUPPORTED_PAYMASTER as [string, ...string[]], {
        message: `Paymaster ID must be one of: ${SUPPORTED_PAYMASTER.join(', ')}`
    }),
    bundlerID: z.enum(SUPPORTED_BUNDLER as [string, ...string[]], {
        message: `Bundler ID must be one of: ${SUPPORTED_BUNDLER.join(', ')}`
    }),
    idempotencyKey: z.string().optional()
});

export const sendTransactionSchema = z.object({
    to: ethAddressSchema,
    value: z.string().regex(/^\d+(\.\d+)?$/, { message: "Value must be a valid numeric string representing ETH" }).optional().default("0"),
    data: hexDataSchema.optional().default("0x"),
    chainId: z.number().positive('Chain ID must be a positive integer'),
    walletID: z.enum(SUPPORTED_WALLETS as [string, ...string[]], {
        message: `Wallet ID must be one of: ${SUPPORTED_WALLETS.join(', ')}`
    }),
    paymasterID: z.enum(SUPPORTED_PAYMASTER as [string, ...string[]], {
        message: `Paymaster ID must be one of: ${SUPPORTED_PAYMASTER.join(', ')}`
    }),
    bundlerID: z.enum(SUPPORTED_BUNDLER as [string, ...string[]], {
        message: `Bundler ID must be one of: ${SUPPORTED_BUNDLER.join(', ')}`
    }),
    idempotencyKey: z.string().optional(),
    sessionKeyAddress: ethAddressSchema.optional(),
    sessionKeySignature: z.string().optional()
});

export const estimateGasSchema = z.object({
    to: ethAddressSchema.optional(),
    value: z.string().regex(/^\d+(\.\d+)?$/, { message: "Value must be a valid numeric string representing ETH" }).optional().default("0"),
    data: hexDataSchema.optional().default("0x"),
    calls: z.array(z.object({
        to: ethAddressSchema,
        value: z.string().regex(/^\d+(\.\d+)?$/, { message: "Value must be a valid numeric string representing ETH" }).optional().default("0"),
        data: hexDataSchema.optional().default("0x")
    })).optional(),
    chainId: z.number().positive('Chain ID must be a positive integer'),
    walletID: z.enum(SUPPORTED_WALLETS as [string, ...string[]], {
        message: `Wallet ID must be one of: ${SUPPORTED_WALLETS.join(', ')}`
    }),
    paymasterID: z.enum(SUPPORTED_PAYMASTER as [string, ...string[]], {
        message: `Paymaster ID must be one of: ${SUPPORTED_PAYMASTER.join(', ')}`
    }),
    bundlerID: z.enum(SUPPORTED_BUNDLER as [string, ...string[]], {
        message: `Bundler ID must be one of: ${SUPPORTED_BUNDLER.join(', ')}`
    })
}).refine(data => data.to || (data.calls && data.calls.length > 0), {
    message: "Either 'to' field or a non-empty 'calls' array is required"
});

export const userOpStatusSchema = z.object({
    userOpHash: userOpHashSchema,
    chainId: z.number().positive('Chain ID must be a positive integer'),
    bundlerId: z.enum(SUPPORTED_BUNDLER as [string, ...string[]], {
        message: `Bundler ID must be one of: ${SUPPORTED_BUNDLER.join(', ')}`
    })
});

export const createSessionKeySchema = z.object({
    ownerAddress: ethAddressSchema,
    publicKey: ethAddressSchema,
    chainId: z.number().positive('Chain ID must be a positive integer'),
    expiresAt: z.string().datetime({ message: "Invalid expiration ISO datetime format" }).optional(),
    signature: z.string().optional(),
    permissions: z.array(z.object({
        target: ethAddressSchema,
        allowedFunctions: z.array(z.string().min(1)),
        spendingLimit: z.string().regex(/^\d+$/, { message: "spendingLimit must be a numeric integer string" })
    })).min(1, "At least one permission is required")
});

export const revokeSessionKeySchema = z.object({
    publicKey: ethAddressSchema
});

export const validateSessionKeySchema = z.object({
    publicKey: ethAddressSchema,
    targetContract: ethAddressSchema,
    functionSelector: z.string().min(1),
    value: z.string().regex(/^\d+$/).optional().default("0")
});

export const sendTransactionBatchSchema = z.object({
    calls: z.array(z.object({
        to: ethAddressSchema,
        value: z.string().regex(/^\d+(\.\d+)?$/, { message: "Value must be a valid numeric string representing ETH" }).optional().default("0"),
        data: hexDataSchema.optional().default("0x")
    })).min(1, "At least one call is required in the batch"),
    chainId: z.number().positive('Chain ID must be a positive integer'),
    walletID: z.enum(SUPPORTED_WALLETS as [string, ...string[]], {
        message: `Wallet ID must be one of: ${SUPPORTED_WALLETS.join(', ')}`
    }),
    paymasterID: z.enum(SUPPORTED_PAYMASTER as [string, ...string[]], {
        message: `Paymaster ID must be one of: ${SUPPORTED_PAYMASTER.join(', ')}`
    }),
    bundlerID: z.enum(SUPPORTED_BUNDLER as [string, ...string[]], {
        message: `Bundler ID must be one of: ${SUPPORTED_BUNDLER.join(', ')}`
    }),
    idempotencyKey: z.string().optional(),
    sessionKeyAddress: ethAddressSchema.optional(),
    sessionKeySignature: z.string().optional()
});

export const validateCompatibilitySchema = z.object({
    bundlerID: z.string().min(1, 'Bundler ID is required'),
    paymasterID: z.string().min(1, 'Paymaster ID is required'),
    walletID: z.string().min(1, 'Wallet ID is required'),
    chainId: z.number().positive('Chain ID must be a positive integer')
});

export const portfolioRefreshSchema = z.object({
    address: ethAddressSchema,
    chainId: z.number().positive('Chain ID must be a positive integer')
});

// Generic validation middleware
export function validateBody<T>(schema: z.Schema<T>) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            req.body = await schema.parseAsync(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const formattedErrors = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join('; ');
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: `Request validation failed: ${formattedErrors}`,
                        requestId: (req as any).requestId || 'unknown',
                        timestamp: new Date().toISOString()
                    }
                });
                return;
            }
            next(error);
        }
    };
}
