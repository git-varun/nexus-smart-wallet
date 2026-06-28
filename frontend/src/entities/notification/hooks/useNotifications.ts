import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useBackendSmartAccount } from '@/entities/wallet/hooks/useBackendSmartAccount';
import { useNotificationPipeline } from '@/app/providers/NotificationContext';
import { apiClient } from '@/services/apiClient';
import { QUERY_KEYS } from '@/shared/lib/reactQuery';
import { recordError } from '@/shared/api/client';
import { toAppNotification } from '../model/adapter';

export interface SseEvent {
    id: string;
    type: string;
    timestamp: string;
    payload: any;
}

export type SseStatusType = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';

// Global SSE Telemetry
export let sseStatus: SseStatusType = 'DISCONNECTED';
export const sseEvents: SseEvent[] = [];

// Helper to push event and dispatch notification
const recordSseEvent = (type: string, payload: any) => {
    const newEvent: SseEvent = {
        id: Math.random().toString(36).substring(2, 9),
        type,
        timestamp: new Date().toISOString(),
        payload
    };
    sseEvents.unshift(newEvent);
    if (sseEvents.length > 50) {
        sseEvents.pop();
    }
    window.dispatchEvent(new CustomEvent('nexus-sse-event', { detail: newEvent }));
};

const setSseStatus = (status: SseStatusType) => {
    sseStatus = status;
    window.dispatchEvent(new CustomEvent('nexus-sse-status-change', { detail: status }));
};

export function useNotifications() {
    const { token, isAuthenticated, smartAccountAddress, currentChainId } = useBackendSmartAccount();
    const { addNotification } = useNotificationPipeline();
    const queryClient = useQueryClient();

    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef<number>(0);
    const lastEventIdRef = useRef<string | null>(null);
    const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isAuthenticated || !token) {
            setSseStatus('DISCONNECTED');
            return;
        }

        const invalidateCaches = (type: string) => {
            if (smartAccountAddress) {
                queryClient.invalidateQueries({ 
                    queryKey: QUERY_KEYS.transactions.history(smartAccountAddress, currentChainId) 
                });
                queryClient.invalidateQueries({ 
                    queryKey: QUERY_KEYS.wallet.portfolio(smartAccountAddress, currentChainId) 
                });
                recordSseEvent('cache_invalidation', { 
                    type, 
                    reason: `Invalidated transaction history and portfolio for address ${smartAccountAddress}` 
                });
            }
        };

        const resetHeartbeatTimeout = () => {
            if (heartbeatTimeoutRef.current) {
                clearTimeout(heartbeatTimeoutRef.current);
            }
            heartbeatTimeoutRef.current = setTimeout(() => {
                console.warn('⚠️ No heartbeat received for 35 seconds. Connection stale. Reconnecting...');
                recordSseEvent('connection_stale', { message: 'Heartbeat timeout. Initiating reconnect.' });
                connectSse();
            }, 35000);
        };

        const connectSse = () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            if (heartbeatTimeoutRef.current) {
                clearTimeout(heartbeatTimeoutRef.current);
            }

            const baseUrl = (apiClient as any).baseUrl || 'http://localhost:3000';
            let url = `${baseUrl}/api/notifications/subscribe?token=${encodeURIComponent(token)}`;
            if (lastEventIdRef.current) {
                url += `&lastEventId=${encodeURIComponent(lastEventIdRef.current)}`;
            }
            
            console.log('🔌 Connecting to notifications SSE stream...');
            setSseStatus('CONNECTING');
            recordSseEvent('connection_connecting', { url, lastEventId: lastEventIdRef.current });

            const eventSource = new EventSource(url);
            eventSourceRef.current = eventSource;

            resetHeartbeatTimeout();

            eventSource.addEventListener('heartbeat', () => {
                resetHeartbeatTimeout();
            });

            eventSource.addEventListener('connected', () => {
                resetHeartbeatTimeout();
                console.log('🔌 Notifications stream connected.');
                setSseStatus('CONNECTED');
                reconnectAttemptsRef.current = 0; // Reset reconnect attempts
                recordSseEvent('connection_established', { message: 'SSE notification connection active.' });
            });

            eventSource.addEventListener('message', (event) => {
                resetHeartbeatTimeout();
                try {
                    const message = JSON.parse(event.data);
                    
                    // Store the last received event ID to allow event replay on reconnect
                    if (event.lastEventId) {
                        lastEventIdRef.current = event.lastEventId;
                    } else if (message.id) {
                        lastEventIdRef.current = message.id;
                    }

                    const { type, payload } = message;
                    recordSseEvent(type, payload);

                    switch (type) {
                        case 'deployment.complete':
                        case 'transaction.confirmed':
                        case 'transaction.failed':
                        case 'transaction.retry_started':
                        case 'session.expired':
                        case 'sponsorship.rejected': {
                            const appNotification = toAppNotification(type, payload);
                            addNotification({
                                type,
                                title: appNotification.title || '',
                                description: appNotification.description || '',
                                variant: appNotification.variant || 'default'
                            });
                            invalidateCaches(type);
                            if (type === 'transaction.failed') {
                                recordError('API', `Transaction execution failed: ${payload.error || 'Unknown error'}`, 'TRANSACTION_FAILED');
                            } else if (type === 'sponsorship.rejected') {
                                recordError('Capability', `Paymaster rejected gas sponsorship: ${payload.error}`, 'SPONSORED_TRANSACTION_REJECTED');
                            }
                            break;
                        }
                        default:
                            console.log('Unknown SSE notification event:', type, payload);
                    }
                } catch (err) {
                    console.error('Failed to parse notification SSE message:', err);
                }
            });

            eventSource.onerror = (error) => {
                console.error('Notification SSE connection error:', error);
                setSseStatus('ERROR');
                recordSseEvent('connection_error', { error: 'EventSource disconnected unexpectedly' });
                recordError('SSE', 'Notification SSE stream disconnected unexpectedly.', 'SSE_CONNECTION_LOST', 0);
                
                // Exponential backoff reconnect
                const delay = Math.min(Math.pow(2, reconnectAttemptsRef.current) * 1000, 30000);
                reconnectAttemptsRef.current += 1;
                
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                }
                
                reconnectTimeoutRef.current = setTimeout(() => {
                    connectSse();
                }, delay);
            };
        };

        connectSse();

        return () => {
            console.log('🔌 Disconnecting notifications SSE stream...');
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
            if (heartbeatTimeoutRef.current) {
                clearTimeout(heartbeatTimeoutRef.current);
                heartbeatTimeoutRef.current = null;
            }
            setSseStatus('DISCONNECTED');
            recordSseEvent('connection_closed', { reason: 'Component unmounted or auth state changed' });
        };
    }, [isAuthenticated, token, smartAccountAddress, currentChainId, queryClient, addNotification]);
}
