/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/shared/hooks/useToast';

export interface NotificationItem {
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    read: boolean;
    variant: 'default' | 'success' | 'warning' | 'error';
}

interface NotificationContextProps {
    notifications: NotificationItem[];
    unreadCount: number;
    addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
    markAllAsRead: () => void;
    clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const { toast } = useToast();

    // Load initial notifications from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('nexus-notifications-inbox');
        if (stored) {
            try {
                setNotifications(JSON.parse(stored));
            } catch (err) {
                console.error('Failed to parse notifications from storage:', err);
            }
        }
    }, []);


    const addNotification = (newItem: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        const timestamp = new Date().toISOString();
        const notification: NotificationItem = {
            ...newItem,
            id,
            timestamp,
            read: false,
        };

        // 1. Toast (transient display)
        toast({
            title: notification.title,
            description: notification.description,
            variant: notification.variant,
        });

        // 2. Notification Inbox (persistent display)
        // Keep only latest 100 entries to prevent localstorage bloat
        setNotifications(prev => {
            const updated = [notification, ...prev].slice(0, 100);
            localStorage.setItem('nexus-notifications-inbox', JSON.stringify(updated));
            return updated;
        });
    };

    const markAllAsRead = () => {
        setNotifications(prev => {
            const updated = prev.map(item => ({ ...item, read: true }));
            localStorage.setItem('nexus-notifications-inbox', JSON.stringify(updated));
            return updated;
        });
    };

    const clearNotifications = () => {
        setNotifications([]);
        localStorage.removeItem('nexus-notifications-inbox');
    };

    const unreadCount = notifications.filter(item => !item.read).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            addNotification,
            markAllAsRead,
            clearNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotificationPipeline = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotificationPipeline must be used within a NotificationProvider');
    }
    return context;
};
