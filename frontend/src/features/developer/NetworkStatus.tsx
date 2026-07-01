/* eslint-disable react-refresh/only-export-components */
import React, {useEffect, useState, useCallback} from 'react';
import {apiClient} from '@/services/apiClient';
import {Button} from '@/shared/ui/Button';
import {Card} from '@/shared/ui/Card';

interface NetworkStatus {
    isOnline: boolean;
    apiConnected: boolean;
    lastChecked: number;
    rtt: number | null; // Round trip time
}

export const NetworkStatus: React.FC = () => {
    const [status, setStatus] = useState<NetworkStatus>({
        isOnline: navigator.onLine,
        apiConnected: false,
        lastChecked: Date.now(),
        rtt: null
    });
    const [isVisible, setIsVisible] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);

    const checkApiConnection = useCallback(async (): Promise<boolean> => {
        try {
            const startTime = Date.now();
            const response = await apiClient.getHealthCheck();
            const endTime = Date.now();

            if (response.status === 'UP') {
                setStatus(prev => ({
                    ...prev,
                    apiConnected: true,
                    lastChecked: Date.now(),
                    rtt: endTime - startTime
                }));
                setLastError(null);
                return true;
            } else {
                throw new Error('Health check failed');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setLastError(errorMessage);
            setStatus(prev => ({
                ...prev,
                apiConnected: false,
                lastChecked: Date.now(),
                rtt: null
            }));
            return false;
        }
    }, []);

    const handleOnlineStatusChange = useCallback(() => {
        const isOnline = navigator.onLine;
        setStatus(prev => ({...prev, isOnline}));

        if (isOnline) {
            // When coming back online, check API connection
            checkApiConnection();
        } else {
            setStatus(prev => ({...prev, apiConnected: false}));
        }

        // Show status temporarily
        setIsVisible(true);
        setTimeout(() => setIsVisible(false), 3000);
    }, [checkApiConnection]);

    const handleRetryConnection = useCallback(async () => {
        setIsVisible(true);
        await checkApiConnection();
        setTimeout(() => setIsVisible(false), 2000);
    }, [checkApiConnection]);

    useEffect(() => {
        // Initial API connection check
        checkApiConnection();

        // Listen for online/offline events
        window.addEventListener('online', handleOnlineStatusChange);
        window.addEventListener('offline', handleOnlineStatusChange);

        // Periodic health checks (every 30 seconds)
        const healthCheckInterval = setInterval(async () => {
            if (navigator.onLine) {
                const connected = await checkApiConnection();

                // Show status if connection state changed
                if (connected !== status.apiConnected) {
                    setIsVisible(true);
                    setTimeout(() => setIsVisible(false), 2000);
                }
            }
        }, 30000);

        // Show status if connection is poor
        const connectionMonitor = setInterval(() => {
            if (!status.isOnline || !status.apiConnected) {
                setIsVisible(true);
            }
        }, 5000);

        return () => {
            window.removeEventListener('online', handleOnlineStatusChange);
            window.removeEventListener('offline', handleOnlineStatusChange);
            clearInterval(healthCheckInterval);
            clearInterval(connectionMonitor);
        };
    }, [checkApiConnection, handleOnlineStatusChange, status.apiConnected, status.isOnline]);

    // Auto-hide if connection is good
    useEffect(() => {
        if (status.isOnline && status.apiConnected && isVisible) {
            const timer = setTimeout(() => setIsVisible(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [status.isOnline, status.apiConnected, isVisible]);

    const shouldShowStatus = isVisible || !status.isOnline || !status.apiConnected;

    if (!shouldShowStatus) {
        return null;
    }

    const getStatusColor = () => {
        if (!status.isOnline) return 'bg-red-500';
        if (!status.apiConnected) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getStatusText = () => {
        if (!status.isOnline) return 'Offline';
        if (!status.apiConnected) return 'API Disconnected';
        return 'Connected';
    };

    const getStatusMessage = () => {
        if (!status.isOnline) {
            return 'No internet connection. Please check your network settings.';
        }
        if (!status.apiConnected) {
            return lastError ? `API connection failed: ${lastError}` : 'Cannot connect to the backend API.';
        }
        return `Connected to API (${status.rtt}ms response time)`;
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
            <Card className={`p-4 shadow-xl border border-border/80 border-l-4 bg-slate-900/95 backdrop-blur-md transition-all duration-300 ${
                !status.isOnline ? 'border-l-destructive/80' :
                    !status.apiConnected ? 'border-l-amber-500/80' :
                        'border-l-emerald-500/80'
            }`}>
                <div className="flex items-center space-x-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor()} ${
                        !status.isOnline || !status.apiConnected ? 'animate-pulse' : ''
                    }`}></div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                            {getStatusText()}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate leading-relaxed">
                            {getStatusMessage()}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium mt-1">
                            Last checked: {new Date(status.lastChecked).toLocaleTimeString()}
                        </p>
                    </div>
                    {(!status.isOnline || !status.apiConnected) && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleRetryConnection}
                            className="h-7 text-[10px] px-2.5 border-border/85 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                        >
                            Retry
                        </Button>
                    )}
                </div>

                {/* Dismissible for successful connections */}
                {status.isOnline && status.apiConnected && (
                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute top-2 right-2 text-slate-500 hover:text-slate-300 transition-colors"
                        aria-label="Dismiss network status"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                )}
            </Card>
        </div>
    );
};

// Hook for accessing network status in other components
export const useNetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [apiConnected, setApiConnected] = useState(false);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        const checkApi = async () => {
            try {
                const response = await apiClient.getHealthCheck();
                setApiConnected(response.status === 'UP');
            } catch {
                setApiConnected(false);
            }
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check API connection initially and periodically
        checkApi();
        const interval = setInterval(checkApi, 30000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    return {isOnline, apiConnected};
};
