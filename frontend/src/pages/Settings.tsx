import React, { useState, useEffect } from 'react';
import { Page } from '@/app/layouts/Layout';
import { StateView } from '@/shared/ui/StateView';
import { useBackendSmartAccount } from '@/entities/wallet/hooks/useBackendSmartAccount';
import { 
    UserProfileTab, 
    WalletPreferencesTab, 
    TransactionPreferencesTab, 
    NotificationPreferencesTab, 
    AppearancePreferencesTab, 
    AdvancedConfigTab, 
    SystemPreferencesTab 
} from '@/features/settings/UserProfile';
import { 
    User, Globe, Activity, Bell, Palette, Terminal, RefreshCw, WifiOff 
} from 'lucide-react';

const Settings: React.FC = () => {
    const { isAuthenticated, loading, checkAuthStatus } = useBackendSmartAccount();
    const [activeTab, setActiveTab] = useState<string>('profile');
    const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

    // Track online/offline status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Tabs configuration
    const tabs = [
        { id: 'profile', label: 'User Profile & Accounts', icon: User, component: UserProfileTab },
        { id: 'wallet', label: 'Wallet Preferences', icon: Globe, component: WalletPreferencesTab },
        { id: 'transaction', label: 'Transaction defaults', icon: Activity, component: TransactionPreferencesTab },
        { id: 'notifications', label: 'Notifications', icon: Bell, component: NotificationPreferencesTab },
        { id: 'appearance', label: 'Appearance', icon: Palette, component: AppearancePreferencesTab },
        { id: 'advanced', label: 'Advanced Diagnostics', icon: Terminal, component: AdvancedConfigTab },
        { id: 'system', label: 'System Backup', icon: RefreshCw, component: SystemPreferencesTab },
    ];

    // Async State Handling (Phase 10)
    
    // 1. Loading State
    if (loading) {
        return (
            <Page title="Settings">
                <div className="flex items-center justify-center min-h-[400px]">
                    <StateView type="loading" title="Loading Settings" description="Retrieving your profile preferences from the backend secure store." />
                </div>
            </Page>
        );
    }

    // 2. Unauthorized State
    if (!isAuthenticated) {
        return (
            <Page title="Settings">
                <div className="flex items-center justify-center min-h-[400px]">
                    <StateView 
                        type="unauthorized" 
                        title="Access Denied" 
                        description="You must log in to view and configure smart wallet preferences." 
                        actionText="Reload App"
                        onAction={() => checkAuthStatus()}
                    />
                </div>
            </Page>
        );
    }

    const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || UserProfileTab;

    return (
        <Page 
            title="Settings & Configuration" 
            description="Manage your smart account profile, chain choices, transaction gas policies, UI appearances, and system diagnostics."
            breadcrumbs={['Dashboard', 'Settings']}
        >
            {/* Offline Alert Banner */}
            {!isOnline && (
                <div className="flex items-center gap-3 p-4 border border-yellow-500/20 bg-yellow-500/5 text-yellow-400 rounded-xl mb-6">
                    <WifiOff className="w-5 h-5 shrink-0 animate-bounce" />
                    <div className="text-xs">
                        <span className="font-bold">Offline Mode:</span> You are currently offline. Local changes to preferences will persist, but profile syncing and upload features are disabled until connection is restored.
                    </div>
                </div>
            )}

            {/* Main Tabs Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                
                {/* Left Sidebar Nav */}
                <aside className="lg:col-span-1 bg-card/30 border border-border/60 rounded-xl p-3 space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block px-3 py-2 border-b border-border/40 mb-2">
                        Settings Modules
                    </span>
                    {tabs.map((tab) => {
                        const IconComponent = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all text-left focus:outline-none ${
                                    isActive 
                                        ? 'bg-primary/10 text-primary border-l-2 border-primary' 
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/10'
                                }`}
                            >
                                <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                                <span className="truncate">{tab.label}</span>
                            </button>
                        );
                    })}
                </aside>

                {/* Right Content Pane */}
                <div className="lg:col-span-3">
                    <ActiveComponent />
                </div>
            </div>
        </Page>
    );
};

export default Settings;
