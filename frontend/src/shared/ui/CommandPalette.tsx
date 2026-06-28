import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/app/providers/ThemeContext';
import { useBackendSmartAccount } from '@/entities/wallet/hooks/useBackendSmartAccount';
import { 
    Search, Terminal, LogOut, Copy, Laptop, Sun, 
    Moon, CornerDownLeft, Coins, Key, ArrowRight
} from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { ROUTE_REGISTRY } from '@/app/config/routes';

export interface CommandItem {
    id: string;
    title: string;
    description: string;
    category: 'Navigation' | 'Commands' | 'Preferences' | 'Entities' | 'Addresses' | 'Recent Pages' | 'Recent Actions';
    icon: React.ComponentType<{ className?: string }>;
    action: (navigate: ReturnType<typeof useNavigate>, context: any) => void;
}

// Architecture allowing future entity search support
const resolveDynamicCommands = (
    query: string, 
    _smartAccountAddress: string | undefined
): CommandItem[] => {
    if (!query) return [];
    const commands: CommandItem[] = [];
    const trimmed = query.trim();

    // 1. Future entity support: Addresses
    if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
        commands.push({
            id: `entity-address-send-${trimmed}`,
            title: `Transfer to Address`,
            description: `Queue transfer to ${trimmed.substring(0, 10)}...`,
            category: 'Addresses',
            icon: ArrowRight,
            action: (navigate) => navigate(`/transfer?recipient=${trimmed}`)
        });
        commands.push({
            id: `entity-address-copy-${trimmed}`,
            title: `Copy Target Address`,
            description: trimmed,
            category: 'Addresses',
            icon: Copy,
            action: () => {
                navigator.clipboard.writeText(trimmed);
            }
        });
    }

    // 2. Future entity support: Assets search resolver hook
    const knownTokens = ['ETH', 'USDC', 'DAI', 'LINK', 'UNI'];
    const matchedToken = knownTokens.find(token => token.toLowerCase() === trimmed.toLowerCase());
    if (matchedToken) {
        commands.push({
            id: `entity-asset-${matchedToken}`,
            title: `View Asset: ${matchedToken}`,
            description: `Check live balances and transactions of ${matchedToken}`,
            category: 'Entities',
            icon: Coins,
            action: (navigate) => navigate(`/assets?focus=${matchedToken}`)
        });
    }

    // 3. Future entity support: Session Keys search resolver hook
    if (trimmed.toLowerCase().includes('key') || trimmed.toLowerCase().includes('session')) {
        commands.push({
            id: 'entity-session-key-manage',
            title: 'Manage Session Keys',
            description: 'Navigate to Security to manage permissions',
            category: 'Entities',
            icon: Key,
            action: (navigate) => navigate('/security')
        });
    }

    return commands;
};

export const CommandPalette: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const [recentPages, setRecentPages] = useState<Omit<CommandItem, 'action'>[]>([]);
    const [recentActions, setRecentActions] = useState<Omit<CommandItem, 'action'>[]>([]);
    const [devMode, setDevMode] = useState(false);
    
    const navigate = useNavigate();
    const { setTheme } = useTheme();
    const { smartAccountAddress, disconnect } = useBackendSmartAccount();
    const paletteRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync devMode and recents from localStorage when opened
    useEffect(() => {
        if (isOpen) {
            setDevMode(localStorage.getItem('nexus-dev-mode') === 'enabled');
            
            const storedPages = localStorage.getItem('nexus-recent-pages');
            if (storedPages) {
                try { setRecentPages(JSON.parse(storedPages)); } catch { setRecentPages([]); }
            }
            
            const storedActions = localStorage.getItem('nexus-recent-actions');
            if (storedActions) {
                try { setRecentActions(JSON.parse(storedActions)); } catch { setRecentActions([]); }
            }
        }
    }, [isOpen]);

    // Keyboard trigger (Ctrl+K / Cmd+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setSearch('');
            setActiveIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }, [isOpen]);

    // Handle outside clicks
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Construct static routes dynamically from registry
    const navigationCommands: CommandItem[] = ROUTE_REGISTRY
        .filter(route => route.searchable && (!route.developerOnly || devMode))
        .map(route => ({
            id: `nav-${route.id}`,
            title: `Go to ${route.title}`,
            description: `Navigate to ${route.pageTitle.toLowerCase()}`,
            category: 'Navigation',
            icon: route.icon,
            action: (nav) => nav(route.path)
        }));

    // Preferences & structural commands
    const actionsAndPreferences: CommandItem[] = [
        {
            id: 'theme-dark',
            title: 'Set Theme: Dark',
            description: 'Switch application to dark appearance',
            category: 'Preferences',
            icon: Moon,
            action: (_, { setTheme }) => setTheme('dark')
        },
        {
            id: 'theme-light',
            title: 'Set Theme: Light',
            description: 'Switch application to light appearance',
            category: 'Preferences',
            icon: Sun,
            action: (_, { setTheme }) => setTheme('light')
        },
        {
            id: 'theme-system',
            title: 'Set Theme: System',
            description: 'Use system theme settings',
            category: 'Preferences',
            icon: Laptop,
            action: (_, { setTheme }) => setTheme('system')
        },
        {
            id: 'dev-toggle',
            title: 'Toggle Developer Mode',
            description: 'Turn developer widgets on or off',
            category: 'Preferences',
            icon: Terminal,
            action: () => {
                const current = localStorage.getItem('nexus-dev-mode') === 'enabled';
                if (current) {
                    localStorage.removeItem('nexus-dev-mode');
                } else {
                    localStorage.setItem('nexus-dev-mode', 'enabled');
                }
                window.dispatchEvent(new Event('storage'));
            }
        },
        {
            id: 'copy-address',
            title: 'Copy Wallet Address',
            description: 'Copy smart account address to clipboard',
            category: 'Commands',
            icon: Copy,
            action: (_, { address }) => {
                if (address) {
                    navigator.clipboard.writeText(address);
                }
            }
        },
        {
            id: 'disconnect',
            title: 'Disconnect Wallet',
            description: 'Sign out of the current smart session',
            category: 'Commands',
            icon: LogOut,
            action: (_, { disconnect }) => disconnect()
        }
    ];

    const allStaticCommands = [...navigationCommands, ...actionsAndPreferences];

    // Filter static commands based on search
    const filteredStatic = allStaticCommands.filter(item => {
        const text = `${item.title} ${item.description} ${item.category}`.toLowerCase();
        return text.includes(search.toLowerCase());
    });

    // Dynamic dynamic commands
    const dynamicCommands = resolveDynamicCommands(search, smartAccountAddress || undefined);

    // Compute items to show
    let itemsToShow: CommandItem[] = [];

    if (search === '') {
        // Re-inflate action callback hooks for recent pages and actions
        const inflatedPages = recentPages.map(page => ({
            ...page,
            action: (allStaticCommands.find(c => c.id === page.id)?.action) || (() => {})
        })) as CommandItem[];

        const inflatedActions = recentActions.map(act => ({
            ...act,
            action: (allStaticCommands.find(c => c.id === act.id)?.action) || (() => {})
        })) as CommandItem[];

        itemsToShow = [
            ...inflatedPages,
            ...inflatedActions,
            ...allStaticCommands
        ];
    } else {
        itemsToShow = [
            ...dynamicCommands,
            ...filteredStatic
        ];
    }

    const handleSelect = (item: CommandItem) => {
        // Save recents
        if (item.category === 'Navigation') {
            const pageData = { id: item.id, title: item.title, description: item.description, category: 'Recent Pages' as const, icon: item.icon };
            const nextPages = [pageData, ...recentPages.filter(p => p.id !== item.id)].slice(0, 3);
            localStorage.setItem('nexus-recent-pages', JSON.stringify(nextPages));
        } else if (item.category === 'Commands' || item.category === 'Preferences') {
            const actionData = { id: item.id, title: item.title, description: item.description, category: 'Recent Actions' as const, icon: item.icon };
            const nextActions = [actionData, ...recentActions.filter(a => a.id !== item.id)].slice(0, 3);
            localStorage.setItem('nexus-recent-actions', JSON.stringify(nextActions));
        }

        // Execute action
        item.action(navigate, { setTheme, address: smartAccountAddress, disconnect });
        setIsOpen(false);
    };

    // Keyboard navigation inside list
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev + 1) % itemsToShow.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev - 1 + itemsToShow.length) % itemsToShow.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (itemsToShow[activeIndex]) {
                handleSelect(itemsToShow[activeIndex]);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setIsOpen(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-start justify-center pt-[15vh]">
            <div 
                ref={paletteRef}
                className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-cyber overflow-hidden animate-slide-up"
            >
                {/* Search Bar */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-card/60">
                    <Search className="w-5 h-5 text-muted-foreground" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Type a command, token (e.g. 'ETH'), or address..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setActiveIndex(0);
                        }}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground/60 text-sm focus:ring-0"
                    />
                    <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                        ESC
                    </kbd>
                </div>

                {/* Command List */}
                <div className="max-h-[320px] overflow-y-auto p-2 space-y-1">
                    {itemsToShow.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            No results found.
                        </div>
                    ) : (
                        itemsToShow.map((item, index) => {
                            const Icon = item.icon;
                            const isActive = index === activeIndex;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleSelect(item)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-100",
                                        isActive 
                                            ? "bg-primary/10 border border-primary/20 text-primary" 
                                            : "border border-transparent text-foreground hover:bg-muted/40"
                                    )}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={cn(
                                            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                                            isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                        )}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-semibold text-sm truncate flex items-center gap-1.5">
                                                {item.title}
                                                <span className={cn(
                                                    "text-[9px] font-semibold px-1.5 py-0.5 rounded border",
                                                    item.category === 'Recent Pages' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                                    item.category === 'Recent Actions' && "bg-purple-500/10 text-purple-400 border-purple-500/20",
                                                    item.category === 'Addresses' && "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
                                                    item.category === 'Entities' && "bg-teal-500/10 text-teal-400 border-teal-500/20",
                                                    item.category === 'Navigation' && "bg-primary/10 text-primary border-primary/20",
                                                    item.category === 'Commands' && "bg-muted text-muted-foreground border-border",
                                                    item.category === 'Preferences' && "bg-muted text-muted-foreground border-border"
                                                )}>
                                                    {item.category}
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate">{item.description}</div>
                                        </div>
                                    </div>
                                    {isActive && (
                                        <div className="flex items-center gap-1.5 text-xs text-primary font-semibold font-mono pr-1 select-none">
                                            <span>Execute</span>
                                            <CornerDownLeft className="w-3.5 h-3.5" />
                                        </div>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[10px] text-muted-foreground bg-muted/20 font-medium">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <kbd className="rounded border border-border px-1 py-0.5 bg-muted">↑↓</kbd> Navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="rounded border border-border px-1 py-0.5 bg-muted">Enter</kbd> Select
                        </span>
                    </div>
                    <div>
                        <span>Press <kbd className="rounded border border-border px-1 py-0.5 bg-muted">Ctrl + K</kbd> to toggle</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default CommandPalette;
