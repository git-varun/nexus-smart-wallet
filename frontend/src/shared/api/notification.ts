// src/shared/api/notification.ts
import { apiClient } from './client';
import { object, optional, string, number } from './contracts';

export type NotificationEvent =
    | { id?: string; type: 'deployment.complete' | 'transaction.confirmed'; timestamp?: string; payload: { transactionId: string; accountId: string; hash: string } }
    | { id?: string; type: 'transaction.failed'; timestamp?: string; payload: { transactionId: string; accountId: string; error: string } }
    | { id?: string; type: 'transaction.retry_started'; timestamp?: string; payload: { transactionId: string; retryCount: number; error: string } }
    | { id?: string; type: 'session.expired'; timestamp?: string; payload: { publicKey: string; expiresAt: string } };

export function parseNotificationEvent(value: unknown): NotificationEvent {
    const event = object(value, 'notification');
    const type = string(event.type, 'notification.type');
    optional(event.id, string, 'notification.id');
    optional(event.timestamp, string, 'notification.timestamp');
    const payload = object(event.payload, 'notification.payload');
    switch (type) {
        case 'deployment.complete':
        case 'transaction.confirmed':
            string(payload.transactionId, 'notification.payload.transactionId');
            string(payload.accountId, 'notification.payload.accountId');
            string(payload.hash, 'notification.payload.hash');
            break;
        case 'transaction.failed':
            string(payload.transactionId, 'notification.payload.transactionId');
            string(payload.accountId, 'notification.payload.accountId');
            string(payload.error, 'notification.payload.error');
            break;
        case 'transaction.retry_started':
            string(payload.transactionId, 'notification.payload.transactionId');
            number(payload.retryCount, 'notification.payload.retryCount');
            string(payload.error, 'notification.payload.error');
            break;
        case 'session.expired':
            string(payload.publicKey, 'notification.payload.publicKey');
            string(payload.expiresAt, 'notification.payload.expiresAt');
            break;
        default:
            throw new Error(`notification.type is not supported by the backend: ${type}`);
    }
    return event as unknown as NotificationEvent;
}

export function getNotificationsStreamUrl(token: string): string {
    const baseUrl = apiClient.baseUrl;
    return `${baseUrl}/api/notifications/subscribe?token=${encodeURIComponent(token)}`;
}
