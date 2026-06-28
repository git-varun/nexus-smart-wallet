// src/entities/notification/model/adapter.ts

export interface AppNotification {
    id: string;
    type: string;
    title: string;
    description: string;
    variant: 'default' | 'error' | 'success' | 'warning';
    timestamp: Date;
    read: boolean;
}

export function toAppNotification(type: string, payload: any): Partial<AppNotification> {
    switch (type) {
        case 'deployment.complete':
            return {
                type,
                title: 'Smart Account Deployed!',
                description: `Smart Account has been successfully deployed. Hash: ${payload.hash.substring(0, 10)}...`,
                variant: 'success'
            };
        case 'transaction.confirmed':
            return {
                type,
                title: 'Transaction Confirmed',
                description: `Transaction completed successfully. Hash: ${payload.hash.substring(0, 10)}...`,
                variant: 'success'
            };
        case 'transaction.failed':
            return {
                type,
                title: 'Transaction Failed',
                description: `Transaction execution failed: ${payload.error || 'Unknown error'}`,
                variant: 'error'
            };
        case 'transaction.retry_started':
            return {
                type,
                title: 'Retrying Transaction',
                description: `Transient network/gas issue detected. Retrying transaction (Attempt #${payload.retryCount})...`,
                variant: 'default'
            };
        case 'session.expired':
            return {
                type,
                title: 'Session Key Expired',
                description: `Your session key (${payload.publicKey.substring(0, 8)}...) has expired.`,
                variant: 'warning'
            };
        case 'sponsorship.rejected':
            return {
                type,
                title: 'Sponsorship Rejected',
                description: `Paymaster rejected transaction gas sponsorship: ${payload.error}`,
                variant: 'error'
            };
        default:
            return {
                type,
                title: 'Alert',
                description: 'System notification received.',
                variant: 'default'
            };
    }
}
