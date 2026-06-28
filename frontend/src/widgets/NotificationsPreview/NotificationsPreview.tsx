import React from 'react';
import { Bell, CheckSquare, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { useNotificationPipeline } from '@/app/providers/NotificationContext';
import { Badge } from '@/shared/ui/Badge';

export const NotificationsPreview: React.FC = () => {
    const { notifications, unreadCount, markAllAsRead, clearNotifications } = useNotificationPipeline();

    const getVariantBadge = (variant: string) => {
        switch (variant) {
            case 'success': return 'success';
            case 'warning': return 'warning';
            case 'error': return 'danger';
            default: return 'default';
        }
    };

    return (
        <Card variant="default" className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Bell className="w-5 h-5 text-web3-primary" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center text-[8px] text-white font-bold">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <CardTitle className="text-lg font-bold">Recent Alerts</CardTitle>
                </div>
                <div className="flex gap-2">
                    {unreadCount > 0 && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={markAllAsRead}
                            aria-label="Mark all alerts as read"
                            className="p-1.5"
                        >
                            <CheckSquare className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </Button>
                    )}
                    {notifications.length > 0 && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={clearNotifications}
                            aria-label="Clear all notifications"
                            className="p-1.5"
                        >
                            <Trash2 className="w-4 h-4 text-red-500/80 hover:text-red-500" />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {notifications.length === 0 ? (
                    <div className="text-center py-8 bg-muted/10 rounded-lg border border-dashed border-border/40">
                        <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Your inbox is clear</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {notifications.slice(0, 4).map((item) => (
                            <div 
                                key={item.id} 
                                className={`p-3 rounded-lg border flex flex-col gap-1 transition-all hover:bg-card/40 ${
                                    item.read 
                                        ? 'bg-card/20 border-border/20' 
                                        : 'bg-web3-primary/5 border-web3-primary/20 shadow-sm shadow-web3-primary/5'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                                        {!item.read && <span className="w-2 h-2 rounded-full bg-web3-primary"></span>}
                                        {item.title}
                                    </span>
                                    <Badge variant={getVariantBadge(item.variant)}>
                                        {item.variant}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {item.description}
                                </p>
                                <span className="text-[10px] text-muted-foreground/60 text-right mt-1">
                                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
