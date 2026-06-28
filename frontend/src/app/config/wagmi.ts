// frontend/src/config/wagmi.ts
import {getDefaultConfig} from '@rainbow-me/rainbowkit'
import {baseSepolia} from 'wagmi/chains'

export const config = getDefaultConfig({
    appName: 'Smart Wallet ERC-4337',
    projectId: (import.meta as any).env.VITE_WALLETCONNECT_PROJECT_ID || 'your-project-id',
    chains: [baseSepolia],
    ssr: false,
})
