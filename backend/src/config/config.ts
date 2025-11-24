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
        walletApiUrl: `https://api.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY || 'demo'}`,
    },

    // Thirdweb
    thirdweb: {
        clientId: process.env.THIRDWEB_CLIENT_ID || '',
        secretKey: process.env.THIRDWEB_SECRET_KEY || '',
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
            uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/nexus-wallet',
            options: {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            }
        }
    },

    // Security
    security: {
        jwtSecret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
        tokenExpiryHours: 24
    }
};

export function validateConfig(): void {
    const required = [
        {key: 'ALCHEMY_API_KEY', value: config.alchemy.apiKey},
        {key: 'MONGODB_URI', value: config.database.mongodb.uri}
    ];

    const thirdwebOptional = [
        {key: 'THIRDWEB_CLIENT_ID', value: config.thirdweb.clientId},
        {key: 'THIRDWEB_SECRET_KEY', value: config.thirdweb.secretKey}
    ];

    // Only validate in production or when explicitly needed
    if (config.nodeEnv === 'production') {
        for (const {key, value} of required) {
            if (!value) throw new Error(`${key} is required`);
        }
    }

    // Validate thirdweb config if any thirdweb keys are provided
    const hasThirdwebConfig = thirdwebOptional.some(({value}) => !!value);
    if (hasThirdwebConfig) {
        for (const {key, value} of thirdwebOptional) {
            if (!value) console.warn(`Warning: ${key} not set - thirdweb functionality may be limited`);
        }
    }

    // Validate wallet key format if provided
    if (config.centralWallet.privateKey) {
        if (!config.centralWallet.privateKey.startsWith('0x') ||
            config.centralWallet.privateKey.length !== 66) {
            throw new Error('MASTER_WALLET_PRIVATE_KEY must be valid hex (0x + 64 chars)');
        }
    }
}

export const SUPPORTED_WALLETS = ["ALCHEMY", "SIMPLE", "SAFE", "KERNEL", "BICONOMY", "TRUST"];
export const SUPPORTED_PAYMASTER = ["ALCHEMY", "PIMLICO"];
export const SUPPORTED_BUNDLER = ["ALCHEMY", "PIMLICO"];

