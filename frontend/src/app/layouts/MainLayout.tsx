// frontend/src/components/layout/MainLayout.tsx
import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { AuthenticationPage } from '@/features/auth';
import { NetworkStatus } from '@/features/developer/NetworkStatus';
import { Shell } from './Shell';
import { StateView } from '@/shared/ui/StateView';
import { PageErrorBoundary } from './ErrorBoundary';
import { useBackendSmartAccount } from '@/entities/wallet/hooks/useBackendSmartAccount.ts';
import { useNotifications } from '@/entities/notification/hooks/useNotifications';

export const MainLayout: React.FC = () => {
    const { isAuthenticated, loading, loginWithCredentials } = useBackendSmartAccount();
    
    // Start notifications stream when authenticated
    useNotifications();

    const handleAuthSuccess = async (userData: { user: any; token: string }) => {
        try {
            await loginWithCredentials(userData);
        } catch (error) {
            console.error('Failed to complete authentication:', error);
        }
    };

    // Show loading screen while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <StateView type="loading" title="Secure Smart Vault" description="Initializing secure wallet keys and state..." />
            </div>
        );
    }

    // Show authentication page if not authenticated
    if (!isAuthenticated) {
        return <AuthenticationPage onAuthSuccess={handleAuthSuccess} />;
    }

    // Authenticated layout shell routing
    return (
        <>
            <Shell>
                <Suspense fallback={<div className="p-8"><StateView type="loading" /></div>}>
                    <PageErrorBoundary>
                        <Outlet />
                    </PageErrorBoundary>
                </Suspense>
            </Shell>
            <NetworkStatus />
        </>
    );
};
export default MainLayout;
