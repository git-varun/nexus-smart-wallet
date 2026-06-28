import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useBackendSmartAccount } from '@/entities/wallet/hooks/useBackendSmartAccount';
import { ChainSelector } from '@/features/wallet/ChainSelector';
import { ProfileAvatar } from '@/entities/wallet/ui/ProfileAvatar';
import { Drawer } from '@/shared/ui/Drawer';
import { Badge } from '@/shared/ui/Badge';
import { CommandPalette } from '@/shared/ui/CommandPalette';
import { apiClient } from '@/services/apiClient';
import { 
    Activity, Shield, Menu, X, Bell, Search, 
    Terminal, Power, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { ROUTE_REGISTRY, getRouteByPath } from '@/app/config/routes';
import { useNotificationPipeline } from '@/app/providers/NotificationContext';

interface ShellProps {
    children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
    const { 
        user, disconnect, accountInfo, currentChainId, switchChain 
    } = useBackendSmartAccount();
    
    const { notifications, unreadCount, markAllAsRead, clearNotifications } = useNotificationPipeline();
    const location = useLocation();

    // Responsive and drawer states
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    // Mark notifications as read when opening drawer
    useEffect(() => {
        if (notificationsOpen) {
            markAllAsRead();
        }
    }, [notificationsOpen, markAllAsRead]);
    
    // Developer Mode states
    const [devMode, setDevMode] = useState(false);
    const [healthStatus, setHealthStatus] = useState<'healthy' | 'unhealthy' | 'checking'>('checking');
    const [dbStatus, setDbStatus] = useState<any>(null);

    // Sync Developer Mode from localStorage
    const updateDevMode = () => {
        setDevMode(localStorage.getItem('nexus-dev-mode') === 'enabled');
    };

    useEffect(() => {
        updateDevMode();
        window.addEventListener('storage', updateDevMode);
        return () => window.removeEventListener('storage', updateDevMode);
    }, []);

    // Check system health for Developer Mode
    useEffect(() => {
        if (!devMode) return;
        const checkHealth = async () => {
            try {
                setHealthStatus('checking');
                const res = await apiClient.getHealthCheck();
                if (res.success) {
                    setHealthStatus('healthy');
                    setDbStatus(res.data?.database || { status: 'up' });
                } else {
                    setHealthStatus('unhealthy');
                }
            } catch {
                setHealthStatus('unhealthy');
            }
        };
        checkHealth();
        const interval = setInterval(checkHealth, 30000);
        return () => clearInterval(interval);
    }, [devMode]);



    // Computed navigation routes
    const visibleRoutes = ROUTE_REGISTRY.filter(route => {
        if (!route.showInSidebar) return false;
        if (route.developerOnly && !devMode) return false;
        return true;
    });

    const getActiveLabel = () => {
        const activeRoute = getRouteByPath(location.pathname);
        return activeRoute ? activeRoute.pageTitle : 'Smart Wallet';
    };

    const getBreadcrumbs = () => {
        const activeRoute = getRouteByPath(location.pathname);
        if (!activeRoute) return [{ label: 'Overview', path: '/' }];
        
        return activeRoute.breadcrumbs.map((crumb) => {
            const matched = ROUTE_REGISTRY.find(r => r.title === crumb || r.pageTitle === crumb);
            return {
                label: crumb,
                path: matched ? matched.path : '/'
            };
        });
    };

    // Environment tag based on chain
    const getEnvTag = () => {
        switch (currentChainId) {
            case 1:
                return { name: 'Mainnet', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' };
            case 11155111:
                return { name: 'Sepolia', color: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' };
            default:
                return { name: 'Testnet', color: 'bg-primary/10 text-primary border border-primary/20' };
        }
    };

    // Safe area layout styles
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
            <CommandPalette />
            
            {/* Main Page Layout Wrapper */}
            <div className="flex-1 flex relative overflow-hidden">
                {/* 1. Desktop & Tablet Sidebar */}
                <aside 
                    className={cn(
                        "hidden md:flex flex-col border-r border-border bg-card/60 backdrop-blur-md sticky top-0 h-screen transition-all duration-300 z-30 shrink-0",
                        sidebarCollapsed ? "w-20" : "w-64"
                    )}
                >
                    {/* Sidebar Brand Header */}
                    <div className={cn("p-6 flex items-center justify-between border-b border-border h-16 shrink-0", sidebarCollapsed && "justify-center px-4")}>
                        {!sidebarCollapsed && (
                            <Link to="/" className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center shadow-md">
                                    <Shield className="w-4 h-4 text-white" />
                                </div>
                                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">NEXUS</span>
                            </Link>
                        )}
                        {sidebarCollapsed && (
                            <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center shadow-md">
                                <Shield className="w-4 h-4 text-white" />
                            </div>
                        )}
                        
                        <button 
                            type="button" 
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="hidden lg:flex p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200"
                        >
                            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Sidebar Navigation */}
                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                        {visibleRoutes.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group",
                                        isActive 
                                            ? "bg-primary/10 text-primary border border-primary/20" 
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"
                                    )}
                                >
                                    <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                                    {!sidebarCollapsed && <span>{item.title}</span>}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Sidebar Developer mode metrics info */}
                    {devMode && !sidebarCollapsed && (
                        <div className="p-4 mx-3 mb-2 rounded-xl bg-primary/5 border border-primary/20 space-y-2 text-[10px] shrink-0 font-medium">
                            <div className="flex items-center justify-between text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Terminal className="w-3.5 h-3.5 text-primary" />
                                    Dev Console
                                </span>
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded-full text-[9px] uppercase font-bold",
                                    healthStatus === 'healthy' ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                                )}>
                                    {healthStatus}
                                </span>
                            </div>
                            <div className="text-[11px] font-mono truncate text-foreground">
                                API: {apiClient.constructor.name}
                            </div>
                            <div className="text-muted-foreground flex items-center justify-between">
                                <span>DB Sync:</span>
                                <span className="font-mono text-foreground">{dbStatus?.status || 'Active'}</span>
                            </div>
                            <div className="text-muted-foreground flex items-center justify-between">
                                <span>Build:</span>
                                <span className="font-mono text-foreground">v1.0.0-RC1</span>
                            </div>
                        </div>
                    )}

                    {/* Sidebar Footer User Profile */}
                    <div className="p-4 border-t border-border shrink-0">
                        <div className={cn("flex items-center gap-3", sidebarCollapsed && "justify-center")}>
                            {user && (
                                <ProfileAvatar 
                                    userId={user.id} 
                                    username={user.username} 
                                    email={user.email} 
                                    size="md" 
                                />
                            )}
                            {!sidebarCollapsed && user && (
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold truncate text-foreground">{user.username || user.email?.split('@')[0]}</div>
                                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                                </div>
                            )}
                            {!sidebarCollapsed && (
                                <button
                                    onClick={disconnect}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                    title="Sign Out"
                                >
                                    <Power className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </aside>

                {/* 2. Main content view and header */}
                <div className="flex-1 flex flex-col min-w-0 relative overflow-y-auto">
                    {/* Sticky Header */}
                    <header className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border h-16 flex items-center justify-between px-6 z-20 shrink-0">
                        {/* Title & Breadcrumbs */}
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => setMobileMenuOpen(true)}
                                className="md:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                            
                            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                                {getBreadcrumbs().map((b, idx, arr) => (
                                    <React.Fragment key={b.path}>
                                        <Link to={b.path} className="hover:text-foreground transition-colors">
                                            {b.label}
                                        </Link>
                                        {idx < arr.length - 1 && <span className="text-muted-foreground/45">/</span>}
                                    </React.Fragment>
                                ))}
                            </div>
                            <h2 className="sm:hidden text-lg font-bold text-foreground truncate">
                                {getActiveLabel()}
                            </h2>
                        </div>

                        {/* Top Bar Quick Action buttons */}
                        <div className="flex items-center gap-3">
                            {/* Command Palette Trigger */}
                            <button
                                type="button"
                                onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
                                className="hidden md:flex items-center gap-2 px-3 py-1.5 border border-border bg-card/60 hover:bg-muted/40 rounded-xl text-xs text-muted-foreground hover:text-foreground transition-all duration-200"
                            >
                                <Search className="w-3.5 h-3.5" />
                                <span>Search...</span>
                                <kbd className="bg-muted px-1.5 py-0.5 rounded border border-border text-[9px] font-mono font-bold">⌘K</kbd>
                            </button>

                            {/* Dev Environment Badge */}
                            {devMode && (
                                <span className={cn("px-2.5 py-1 rounded-lg text-xs font-semibold", getEnvTag().color)}>
                                    {getEnvTag().name}
                                </span>
                            )}

                            {/* Chain Selector */}
                            <ChainSelector
                                selectedChainId={currentChainId}
                                onChainSelect={switchChain}
                                size="sm"
                                popularOnly
                                showTestnets={true}
                                className="min-w-[130px] sm:min-w-[160px]"
                            />

                            {/* Notification Bell */}
                            <button
                                type="button"
                                onClick={() => setNotificationsOpen(true)}
                                className="p-2 rounded-xl border border-border bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 relative"
                            >
                                <Bell className="w-4 h-4" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full animate-pulse" />
                                )}
                            </button>
                        </div>
                    </header>

                    {/* Main Scrollable Area */}
                    <main className="flex-1 overflow-x-hidden pb-20 md:pb-8">
                        {children}
                    </main>

                    {/* 3. Mobile Bottom Navigation */}
                    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card/85 backdrop-blur-md flex items-center justify-around py-2.5 px-2 z-30 pb-safe shadow-lg">
                        {visibleRoutes.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        "flex flex-col items-center gap-1 text-[10px] font-bold transition-colors",
                                        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{item.title}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Mobile Drawer (Sidebar contents for smaller screens) */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex">
                    <div className="w-64 bg-card h-full p-6 flex flex-col border-r border-border animate-slide-in">
                        <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
                            <span className="font-extrabold text-lg text-primary">NEXUS</span>
                            <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <nav className="flex-1 space-y-2">
                            {visibleRoutes.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                                            isActive ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                        )}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span>{item.title}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                        <div className="pt-4 border-t border-border mt-auto">
                            <div className="flex items-center gap-3">
                                {user && <ProfileAvatar userId={user.id} username={user.username} email={user.email} size="sm" />}
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-semibold truncate text-foreground">{user?.username}</div>
                                    <div className="text-[10px] text-muted-foreground truncate">{user?.email}</div>
                                </div>
                                <button onClick={disconnect} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500">
                                    <Power className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
                </div>
            )}

            {/* Slide-in Notifications Drawer */}
            <Drawer
                isOpen={notificationsOpen}
                onClose={() => setNotificationsOpen(false)}
                title="Notifications Stream"
                className="w-full max-w-sm"
            >
                <div className="p-4 space-y-4 flex flex-col h-full overflow-hidden">
                    <div className="flex items-center justify-between shrink-0">
                        <p className="text-xs text-muted-foreground">
                            Recent operations and real-time confirmations sync state.
                        </p>
                        {notifications.length > 0 && (
                            <button 
                                onClick={clearNotifications}
                                className="text-xs text-red-500 hover:text-red-400 font-semibold transition-colors"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                    
                    <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-180px)] pr-1 shrink-0">
                        {accountInfo && (
                            <div className="p-3.5 border border-border bg-card/60 rounded-xl space-y-2 text-xs shrink-0">
                                <div className="flex items-center justify-between font-semibold text-foreground">
                                    <span>Deployment Link</span>
                                    <Badge variant={accountInfo.isDeployed ? 'success' : 'warning'}>
                                        {accountInfo.isDeployed ? 'deployed' : 'pending'}
                                    </Badge>
                                </div>
                                <p className="text-muted-foreground leading-normal">
                                    Address: <span className="font-mono bg-muted/40 px-1 py-0.5 rounded text-[11px]">{accountInfo.address}</span>
                                </p>
                            </div>
                        )}

                        {notifications.length === 0 ? (
                            <div className="p-8 text-center border border-dashed border-border rounded-xl">
                                <Activity className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2 animate-pulse" />
                                <p className="text-xs text-muted-foreground">
                                    No recent notifications.
                                </p>
                            </div>
                        ) : (
                            notifications.map((item) => (
                                <div 
                                    key={item.id} 
                                    className={cn(
                                        "p-3.5 border rounded-xl text-xs space-y-1.5 transition-all duration-200",
                                        item.read ? "bg-card/40 border-border/60" : "bg-primary/5 border-primary/20 shadow-sm"
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="font-bold text-foreground leading-tight">
                                            {item.title}
                                        </span>
                                        <span className="text-[9px] text-muted-foreground font-mono shrink-0">
                                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </Drawer>
        </div>
    );
};
export default Shell;
