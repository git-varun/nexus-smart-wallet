import { useEffect } from 'react';
import { useBackendSmartAccount } from './useBackendSmartAccount';
import { useToast } from './useToast';
import { apiClient } from '../services/apiClient';

export function useNotifications() {
    const { token, isAuthenticated } = useBackendSmartAccount();
    const { toast } = useToast();

    useEffect(() => {
        if (!isAuthenticated || !token) return;

        // Retrieve base URL from apiClient
        const baseUrl = (apiClient as any).baseUrl || 'http://localhost:3000';
        const url = `${baseUrl}/api/notifications/subscribe?token=${encodeURIComponent(token)}`;
        
        console.log('🔌 Connecting to notifications SSE stream...');
        const eventSource = new EventSource(url);

        eventSource.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'connected') {
                    console.log('🔌 Notifications stream connected.');
                    return;
                }

                const { type, payload } = message;

                switch (type) {
                    case 'deployment.complete':
                        toast({
                            title: 'Smart Account Deployed!',
                            description: `Smart Account has been successfully deployed. Hash: ${payload.hash.substring(0, 10)}...`,
                            variant: 'success'
                        });
                        break;
                    case 'transaction.confirmed':
                        toast({
                            title: 'Transaction Confirmed',
                            description: `Transaction completed successfully. Hash: ${payload.hash.substring(0, 10)}...`,
                            variant: 'success'
                        });
                        break;
                    case 'transaction.failed':
                        toast({
                            title: 'Transaction Failed',
                            description: `Transaction execution failed: ${payload.error || 'Unknown error'}`,
                            variant: 'error'
                        });
                        break;
                    case 'transaction.retry_started':
                        toast({
                            title: 'Retrying Transaction',
                            description: `Transient network/gas issue detected. Retrying transaction (Attempt #${payload.retryCount})...`,
                            variant: 'default'
                        });
                        break;
                    case 'session.expired':
                        toast({
                            title: 'Session Key Expired',
                            description: `Your session key (${payload.publicKey.substring(0, 8)}...) has expired.`,
                            variant: 'warning'
                        });
                        break;
                    case 'sponsorship.rejected':
                        toast({
                            title: 'Sponsorship Rejected',
                            description: `Paymaster rejected transaction gas sponsorship: ${payload.error}`,
                            variant: 'error'
                        });
                        break;
                    default:
                        console.log('Unknown SSE notification event:', type, payload);
                }
            } catch (err) {
                console.error('Failed to parse notification SSE message:', err);
            }
        };

        eventSource.onerror = (error) => {
            console.error('Notification SSE connection error:', error);
        };

        return () => {
            console.log('🔌 Disconnecting notifications SSE stream...');
            eventSource.close();
        };
    }, [isAuthenticated, token, toast]);
}
