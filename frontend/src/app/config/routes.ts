// src/app/config/routes.ts
import { Compass, Coins, Send, Activity, Shield, Settings, Terminal, LucideIcon } from 'lucide-react';

export interface RouteConfig {
    id: string;
    title: string;
    path: string;
    icon: LucideIcon;
    requiresAuth: boolean;
    permissions?: string[];
    showInSidebar: boolean;
    showInMobile: boolean;
    searchable: boolean;
    developerOnly: boolean;
    breadcrumbs: string[];
    pageTitle: string;
}

export const ROUTE_REGISTRY: RouteConfig[] = [
    {
        id: 'home',
        title: 'Overview',
        path: '/',
        icon: Compass,
        requiresAuth: true,
        showInSidebar: true,
        showInMobile: true,
        searchable: true,
        developerOnly: false,
        breadcrumbs: ['Home'],
        pageTitle: 'Overview'
    },
    {
        id: 'assets',
        title: 'Assets',
        path: '/assets',
        icon: Coins,
        requiresAuth: true,
        showInSidebar: true,
        showInMobile: true,
        searchable: true,
        developerOnly: false,
        breadcrumbs: ['Home', 'Assets'],
        pageTitle: 'Assets'
    },
    {
        id: 'transfer',
        title: 'Transfer',
        path: '/transfer',
        icon: Send,
        requiresAuth: true,
        showInSidebar: true,
        showInMobile: true,
        searchable: true,
        developerOnly: false,
        breadcrumbs: ['Home', 'Transfer'],
        pageTitle: 'Transfer'
    },
    {
        id: 'activity',
        title: 'Activity',
        path: '/activity',
        icon: Activity,
        requiresAuth: true,
        showInSidebar: true,
        showInMobile: true,
        searchable: true,
        developerOnly: false,
        breadcrumbs: ['Home', 'Activity'],
        pageTitle: 'Activity'
    },
    {
        id: 'security',
        title: 'Security',
        path: '/security',
        icon: Shield,
        requiresAuth: true,
        showInSidebar: true,
        showInMobile: true,
        searchable: true,
        developerOnly: false,
        breadcrumbs: ['Home', 'Security'],
        pageTitle: 'Security'
    },
    {
        id: 'settings',
        title: 'Settings',
        path: '/settings',
        icon: Settings,
        requiresAuth: true,
        showInSidebar: true,
        showInMobile: true,
        searchable: true,
        developerOnly: false,
        breadcrumbs: ['Home', 'Settings'],
        pageTitle: 'Settings'
    },
    {
        id: 'developer',
        title: 'Dev Console',
        path: '/developer',
        icon: Terminal,
        requiresAuth: true,
        showInSidebar: true,
        showInMobile: false,
        searchable: true,
        developerOnly: true,
        breadcrumbs: ['Home', 'Developer Tools'],
        pageTitle: 'Developer Tools'
    }
];

export const getRouteByPath = (path: string): RouteConfig | undefined => {
    return ROUTE_REGISTRY.find(route => route.path === path);
};
export default ROUTE_REGISTRY;
