// src/shared/api/notification.ts
import { apiClient } from './client';

export function getNotificationsStreamUrl(token: string): string {
    const baseUrl = (apiClient as any).baseUrl || 'http://localhost:3000';
    return `${baseUrl}/api/notifications/subscribe?token=${encodeURIComponent(token)}`;
}
