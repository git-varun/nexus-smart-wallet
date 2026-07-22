// frontend/src/config/wagmi.ts
import {getDefaultConfig} from '@rainbow-me/rainbowkit'
import {baseSepolia} from 'wagmi/chains'
import {env} from '@/config/env'

export const config = getDefaultConfig({
    appName: 'Smart Wallet ERC-4337',
    projectId: env.WALLETCONNECT_PROJECT_ID || 'your-project-id',
    chains: [baseSepolia],
    ssr: false,
})
