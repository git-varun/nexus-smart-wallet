// frontend/src/config/env.ts
/// <reference types="vite/client" />
import { z } from 'zod';

const envSchema = z.object({
    API_BASE_URL: z.string().min(1, "VITE_API_BASE_URL must be a non-empty string.")
                   .url("VITE_API_BASE_URL must be a valid URL")
                   .refine((val: string) => val.startsWith('http://') || val.startsWith('https://'), {
                       message: "VITE_API_BASE_URL must start with http:// or https://"
                   })
                   .refine((val: string) => !val.endsWith('/'), {
                       message: "VITE_API_BASE_URL must not have a trailing slash."
                   }),
    ALCHEMY_API_KEY: z.string().default(''),
    ALCHEMY_POLICY_ID: z.string().default(''),
    WALLETCONNECT_PROJECT_ID: z.string().default(''),
    CHAIN_ID: z.coerce.number().default(84532),
    PIMLICO_API_KEY: z.string().default(''),
    PIMLICO_SPONSORSHIP_POLICY_ID: z.string().default(''),
    MODE: z.string().default('production'),
    DEV: z.coerce.boolean().default(false),
});

export type AppEnvironment = z.infer<typeof envSchema>;

function validateEnv(): AppEnvironment {
    const rawEnv = typeof import.meta !== 'undefined' && import.meta.env ? {
        API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
        ALCHEMY_API_KEY: import.meta.env.VITE_ALCHEMY_API_KEY,
        ALCHEMY_POLICY_ID: import.meta.env.VITE_ALCHEMY_POLICY_ID,
        WALLETCONNECT_PROJECT_ID: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
        CHAIN_ID: import.meta.env.VITE_CHAIN_ID,
        PIMLICO_API_KEY: import.meta.env.VITE_PIMLICO_API_KEY,
        PIMLICO_SPONSORSHIP_POLICY_ID: import.meta.env.VITE_PIMLICO_SPONSORSHIP_POLICY_ID,
        MODE: import.meta.env.MODE,
        DEV: import.meta.env.DEV
    } : {
        API_BASE_URL: typeof process !== 'undefined' ? process.env.VITE_API_BASE_URL : undefined,
        ALCHEMY_API_KEY: typeof process !== 'undefined' ? process.env.VITE_ALCHEMY_API_KEY : undefined,
        ALCHEMY_POLICY_ID: typeof process !== 'undefined' ? process.env.VITE_ALCHEMY_POLICY_ID : undefined,
        WALLETCONNECT_PROJECT_ID: typeof process !== 'undefined' ? process.env.VITE_WALLETCONNECT_PROJECT_ID : undefined,
        CHAIN_ID: typeof process !== 'undefined' ? process.env.VITE_CHAIN_ID : undefined,
        PIMLICO_API_KEY: typeof process !== 'undefined' ? process.env.VITE_PIMLICO_API_KEY : undefined,
        PIMLICO_SPONSORSHIP_POLICY_ID: typeof process !== 'undefined' ? process.env.VITE_PIMLICO_SPONSORSHIP_POLICY_ID : undefined,
        MODE: typeof process !== 'undefined' ? process.env.NODE_ENV : undefined,
        DEV: typeof process !== 'undefined' ? process.env.NODE_ENV !== 'production' : undefined
    };

    try {
        return envSchema.parse(rawEnv);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const missingVars = error.errors.map((e: any) => e.message).join(', ');
            console.error("❌ Environment validation failed:", missingVars);
            throw new Error(`Environment validation failed: ${missingVars}`);
        }
        throw error;
    }
}

export const env = validateEnv();

// Configuration Report
if (env.DEV) {
    console.log(`
=========================================
Configuration Report
=========================================
Environment: ${env.MODE}
API Base URL: ${env.API_BASE_URL}
Chain ID: ${env.CHAIN_ID}
Wallet Provider: ${env.WALLETCONNECT_PROJECT_ID ? 'WalletConnect' : 'None'}
Bundler: ${env.PIMLICO_API_KEY ? 'Pimlico' : 'None'}
=========================================
`);
}

