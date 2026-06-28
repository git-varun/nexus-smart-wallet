import dotenv from 'dotenv';
import * as process from "node:process";

dotenv.config();

export const config = {
    // Server
    port: parseInt(process.env.PORT || '3000'),
    nodeEnv: process.env.NODE_ENV || 'development',

    // CORS
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],

    // Alchemy
    alchemy: {
        apiKey: process.env.ALCHEMY_API_KEY || '',
        policyId: process.env.ALCHEMY_POLICY_ID || '',
        walletApiUrl: process.env.ALCHEMY_API_KEY ? `https://api.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}` : '',
    },

    // Pimlico
    pimlico: {
        apiKey: process.env.PIMLICO_API_KEY || '',
        sponsorshipPolicyId: process.env.PIMLICO_POLICY_ID || '',
    },

    // Wallet
    centralWallet: {
        privateKey: process.env.MASTER_WALLET_PRIVATE_KEY || '',
        enabled: process.env.MASTER_WALLET_ENABLED === 'true'
    },

    // Database
    database: {
        mongodb: {
            uri: process.env.MONGODB_URI || '',
            options: {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            }
        }
    },

    // Security
    security: {
        jwtSecret: process.env.JWT_SECRET || '',
        tokenExpiryHours: 24,
        metricsKey: process.env.METRICS_KEY || ''
    },

    // Redis
    redis: {
        uri: process.env.REDIS_URI || 'redis://localhost:6379',
        enabled: process.env.REDIS_ENABLED !== 'false'
    }
};

export function validateConfig(): void {
    const errors: string[] = [];

    // 1. Validate MONGODB_URI
    const mongoUri = config.database.mongodb.uri;
    if (!mongoUri) {
        errors.push('MONGODB_URI is required. Please set it in environment variables.');
    } else if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
        errors.push(`Invalid MONGODB_URI format: ${mongoUri}. Must start with mongodb:// or mongodb+srv://`);
    }

    // 2. Validate ALCHEMY_API_KEY
    if (!config.alchemy.apiKey) {
        errors.push('ALCHEMY_API_KEY is required. Please set it in environment variables.');
    }

    // 3. Validate PIMLICO_API_KEY
    if (!config.pimlico.apiKey) {
        errors.push('PIMLICO_API_KEY is required. Please set it in environment variables.');
    }

    // 4. Validate MASTER_WALLET_PRIVATE_KEY
    const pk = config.centralWallet.privateKey;
    if (!pk) {
        errors.push('MASTER_WALLET_PRIVATE_KEY is required. Please set it in environment variables.');
    } else if (!/^0x[a-fA-F0-9]{64}$/.test(pk)) {
        errors.push('MASTER_WALLET_PRIVATE_KEY must be a valid 32-byte hex string (0x followed by 64 hex characters)');
    } else if (pk.toLowerCase() === '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef') {
        errors.push('MASTER_WALLET_PRIVATE_KEY cannot use the default development key (must be configured with a secure custom value)');
    }

    // 5. Validate JWT_SECRET
    const jwtSecret = config.security.jwtSecret;
    if (!jwtSecret) {
        errors.push('JWT_SECRET is required. Please set it in environment variables.');
    } else if (jwtSecret === 'dev-secret-key-change-in-production') {
        errors.push('JWT_SECRET cannot use the default developer key (must be configured with a secure custom value)');
    } else if (jwtSecret.length < 32) {
        errors.push('JWT_SECRET must be at least 32 characters long in all modes for adequate token security');
    }

    // 6. Validate METRICS_KEY in production
    if (config.nodeEnv === 'production' && !config.security.metricsKey) {
        errors.push('METRICS_KEY is required in production mode to secure the metrics endpoint.');
    }

    // 7. Validate CORS origins
    if (config.corsOrigins) {
        for (const origin of config.corsOrigins) {
            if (origin !== '*' && !origin.startsWith('http://') && !origin.startsWith('https://')) {
                errors.push(`Invalid CORS origin: ${origin}. Must start with http:// or https://, or be '*'`);
            }
        }
    }

    // 8. Validate REDIS_URI
    if (config.redis.enabled && !config.redis.uri) {
        errors.push('REDIS_URI is required when Redis is enabled. Please set it in environment variables.');
    }

    // If any validation errors exist, crash startup immediately
    if (errors.length > 0) {
        console.error('❌ Configuration validation failed:');
        for (const error of errors) {
            console.error(`  - ${error}`);
        }
        throw new Error(`Configuration validation failed: ${errors.join('; ')}`);
    }
}

export const SUPPORTED_WALLETS = ["ALCHEMY", "SIMPLE", "SAFE", "KERNEL", "BICONOMY", "TRUST"];
export const SUPPORTED_PAYMASTER = ["ALCHEMY", "PIMLICO"];
export const SUPPORTED_BUNDLER = ["ALCHEMY", "PIMLICO"];
