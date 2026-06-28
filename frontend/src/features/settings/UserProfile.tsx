import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Toggle } from '@/shared/ui/Toggle';
import { Alert } from '@/shared/ui/Alert';
import { ProfileAvatar } from '@/entities/wallet/ui/ProfileAvatar';
import { useBackendSmartAccount } from '@/entities/wallet/hooks/useBackendSmartAccount';
import { useCapabilityContext } from '@/entities/capability/model/CapabilityContext';
import { FeatureGate } from '@/entities/capability/ui/FeatureGate';
import { useTheme } from '@/app/providers/ThemeContext';
import { useToast } from '@/shared/hooks/useToast';
import { apiClient } from '@/services/apiClient';
import { useDispatch } from 'react-redux';
import { setAuthData } from '@/app/store/smartAccountSlice';
import { validateUsername } from '@/types/user';
import { 
    User as UserIcon, Bell, Palette, Terminal, Key, Cpu, 
    Upload, Trash2, Check, AlertTriangle, Layers, Globe, Activity,
    Download, ShieldCheck, RefreshCw, Layers3, Flame, ExternalLink, Settings2
} from 'lucide-react';

// ==========================================
// 1. Profile & Account Settings Tab
// ==========================================
export const UserProfileTab: React.FC = () => {
    const { user, token, userAccounts, smartAccountAddress, checkAuthStatus } = useBackendSmartAccount();
    const { toast } = useToast();
    const dispatch = useDispatch();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [usernameCheckLoading, setUsernameCheckLoading] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [deletingAvatar, setDeletingAvatar] = useState(false);

    const [formData, setFormData] = useState({
        username: user?.username || '',
        displayName: user?.displayName || '',
    });

    const [sessionDefaults, setSessionDefaults] = useState({
        defaultAccount: smartAccountAddress || '',
        defaultNetwork: '84532', // Default to Base Sepolia ID
    });

    // Update state when user updates
    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                displayName: user.displayName || '',
            });
        }
    }, [user]);

    const checkUsername = useCallback(async (username: string) => {
        if (!username || username === user?.username) {
            setUsernameAvailable(null);
            return;
        }

        const validation = validateUsername(username);
        if (!validation.valid) {
            setUsernameAvailable(false);
            return;
        }

        if (!token) return;

        setUsernameCheckLoading(true);
        try {
            const response = await apiClient.checkUsernameAvailability(token, username);
            if (response.success && response.data) {
                setUsernameAvailable(response.data.available);
            } else {
                setUsernameAvailable(false);
            }
        } catch (error) {
            console.error('Failed to check username availability:', error);
            setUsernameAvailable(false);
        } finally {
            setUsernameCheckLoading(false);
        }
    }, [user?.username, token]);

    const handleSave = async () => {
        if (!token || !user) return;

        // Perform validation
        if (formData.username && formData.username !== user.username) {
            const validation = validateUsername(formData.username);
            if (!validation.valid) {
                toast({
                    title: 'Validation Failed',
                    description: validation.error || 'Invalid username format.',
                    variant: 'error'
                });
                return;
            }
            if (usernameAvailable === false) {
                toast({
                    title: 'Username Taken',
                    description: 'The username you selected is already in use.',
                    variant: 'error'
                });
                return;
            }
        }

        setIsSaving(true);
        try {
            const response = await apiClient.updateProfile(token, {
                username: formData.username,
                displayName: formData.displayName,
                preferences: user.preferences
            });

            if (response.success && response.data) {
                dispatch(setAuthData({ user: response.data, token }));
                setIsEditing(false);
                toast({
                    title: 'Profile Updated',
                    description: 'Your personal information has been saved.',
                    variant: 'success'
                });
                await checkAuthStatus();
            } else {
                toast({
                    title: 'Save Failed',
                    description: response.error?.message || 'Failed to update profile.',
                    variant: 'error'
                });
            }
        } catch (error) {
            console.error('Failed to save profile:', error);
            toast({
                title: 'Error Saving Settings',
                description: 'An unexpected connection error occurred.',
                variant: 'error'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !token) return;

        // Validate file type & size (max 2MB)
        if (!file.type.startsWith('image/')) {
            toast({ title: 'Invalid File', description: 'Please select an image file.', variant: 'error' });
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast({ title: 'File Too Large', description: 'Avatar image must be smaller than 2MB.', variant: 'error' });
            return;
        }

        setUploadingAvatar(true);
        try {
            const response = await apiClient.uploadAvatar(token, file);
            if (response.success && response.data) {
                toast({
                    title: 'Avatar Uploaded',
                    description: 'Your profile picture has been updated.',
                    variant: 'success'
                });
                await checkAuthStatus();
            } else {
                toast({
                    title: 'Upload Failed',
                    description: response.error?.message || 'Failed to upload image.',
                    variant: 'error'
                });
            }
        } catch (error) {
            console.error('Failed to upload avatar:', error);
            toast({ title: 'Upload Error', description: 'Could not connect to upload endpoint.', variant: 'error' });
        } finally {
            setUploadingAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleAvatarDelete = async () => {
        if (!token) return;
        setDeletingAvatar(true);
        try {
            const response = await apiClient.deleteProfileImage(token);
            if (response.success) {
                toast({
                    title: 'Avatar Removed',
                    description: 'Reverted to default generated avatar.',
                    variant: 'success'
                });
                await checkAuthStatus();
            }
        } catch (error) {
            console.error('Failed to delete avatar:', error);
        } finally {
            setDeletingAvatar(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-border">
                    <div>
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <UserIcon className="w-5 h-5 text-primary" />
                            Personal Information
                        </h3>
                        <p className="text-xs text-muted-foreground">Manage your identity details, username lookup, and uploaded image avatar.</p>
                    </div>
                    {!isEditing ? (
                        <Button variant="primary" size="sm" onClick={() => setIsEditing(true)}>
                            Edit Profile
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); setFormData({ username: user?.username || '', displayName: user?.displayName || '' }); }} disabled={isSaving}>
                                Cancel
                            </Button>
                            <Button variant="primary" size="sm" onClick={handleSave} loading={isSaving}>
                                Save Changes
                            </Button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Avatar configuration */}
                    <div className="flex flex-col items-center justify-center p-4 bg-card/25 border border-border/40 rounded-xl space-y-4">
                        <div className="relative group">
                            <ProfileAvatar
                                userId={user?.id}
                                username={user?.username}
                                email={user?.email}
                                profileImageUrl={user?.profileImage}
                                size="xl"
                                animated={true}
                            />
                            {uploadingAvatar && (
                                <div className="absolute inset-0 bg-background/70 backdrop-blur-xs flex items-center justify-center rounded-full">
                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingAvatar || deletingAvatar}
                                className="flex items-center gap-1.5"
                            >
                                <Upload className="w-3.5 h-3.5" />
                                Upload Image
                            </Button>
                            {user?.profileImage && (
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={handleAvatarDelete}
                                    disabled={uploadingAvatar || deletingAvatar}
                                    className="p-2"
                                    title="Delete Avatar"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                        />
                        <p className="text-[10px] text-muted-foreground text-center max-w-[200px]">
                            Supports PNG, JPG, or GIF. Max size 2MB. Custom images are hosted securely on our production servers.
                        </p>
                    </div>

                    {/* Inputs */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground">Username</label>
                                <div className="relative flex gap-2">
                                    <Input
                                        value={formData.username}
                                        onChange={(e) => {
                                            const val = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
                                            setFormData(prev => ({ ...prev, username: val }));
                                            setUsernameAvailable(null);
                                        }}
                                        disabled={!isEditing}
                                        placeholder="Choose username"
                                        className="font-mono text-xs"
                                    />
                                    {isEditing && formData.username && formData.username !== user?.username && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => checkUsername(formData.username)}
                                            loading={usernameCheckLoading}
                                            className="shrink-0 text-xs px-3"
                                        >
                                            Check
                                        </Button>
                                    )}
                                </div>
                                {usernameAvailable === true && (
                                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
                                        <Check className="w-3 h-3" /> Available
                                    </span>
                                )}
                                {usernameAvailable === false && (
                                    <span className="text-[10px] text-red-400 font-medium flex items-center gap-1 mt-1">
                                        <AlertTriangle className="w-3 h-3" /> Unavailable / Reserved
                                    </span>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground">Display Name</label>
                                <Input
                                    value={formData.displayName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                                    disabled={!isEditing}
                                    placeholder="Enter your display name"
                                    className="text-xs"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-foreground">Email Address (Primary Identity)</label>
                            <Input
                                value={user?.email || ''}
                                disabled={true}
                                placeholder="name@domain.com"
                                className="text-xs bg-muted/20"
                            />
                            <p className="text-[10px] text-muted-foreground italic">Your primary identity email address is locked for account integrity and recovery validation.</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Connected Smart Accounts Grid */}
            <Card className="p-6">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-2">
                    <Layers className="w-5 h-5 text-primary" />
                    Connected Smart Accounts
                </h3>
                <p className="text-xs text-muted-foreground mb-4">View your cryptographic smart accounts deployed across different EVM chains.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userAccounts.map((account) => {
                        const isActive = account.address.toLowerCase() === smartAccountAddress?.toLowerCase();
                        return (
                            <div 
                                key={account.address + account.chainId}
                                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                                    isActive 
                                        ? 'border-primary/50 bg-primary/5 shadow-xs' 
                                        : 'border-border/60 bg-card/20'
                                }`}
                            >
                                <div className="space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-xs font-bold text-foreground block">
                                                {account.accountType === 'custodial' ? 'Custodial Account' : 'Smart Wallet'}
                                            </span>
                                            <span className="font-mono text-[10px] text-muted-foreground break-all mt-0.5 block">{account.address}</span>
                                        </div>
                                        {isActive && (
                                            <span className="px-2 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded text-[9px] font-extrabold tracking-wider uppercase">
                                                Active
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center text-[10px] text-muted-foreground border-t border-border/40 pt-2">
                                        <span className="flex items-center gap-1 font-semibold">
                                            <Globe className="w-3 h-3 text-muted-foreground/75" />
                                            Chain ID: {account.chainId}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                            account.isDeployed 
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                        }`}>
                                            {account.isDeployed ? 'On-chain' : 'Counterfactual'}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-3 flex justify-between items-center bg-card/35 p-2 rounded-lg text-xs">
                                    <span className="text-muted-foreground">Balance:</span>
                                    <span className="font-mono font-bold text-foreground">{account.balance || '0.00'} ETH</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Smart Account Defaults (Backlog Persistence) */}
            <Card className="p-6">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-2">
                    <Settings2 className="w-5 h-5 text-primary" />
                    Smart Account Defaults
                </h3>
                <p className="text-xs text-muted-foreground mb-4">Set default parameters for dashboard loading, transactions, and default connections.</p>

                <Alert variant="warning" title="Feature Pending Backend Persistence">
                    Smart Account Default configuration is currently simulated for the active session. Full database persistence of defaults is currently on the Backlog pending backend development.
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Default Connected Account</label>
                        <select
                            value={sessionDefaults.defaultAccount}
                            onChange={(e) => {
                                setSessionDefaults(prev => ({ ...prev, defaultAccount: e.target.value }));
                                toast({
                                    title: 'Session Default Updated',
                                    description: 'Default account selected for active session.',
                                    variant: 'default'
                                });
                            }}
                            className="w-full h-10 p-2.5 rounded-lg border border-border bg-card/40 text-xs text-foreground focus:border-primary focus:outline-none"
                        >
                            {userAccounts.map(acc => (
                                <option key={acc.address} value={acc.address}>{acc.address.slice(0, 10)}... ({acc.balance} ETH)</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Default Network Context</label>
                        <select
                            value={sessionDefaults.defaultNetwork}
                            onChange={(e) => {
                                setSessionDefaults(prev => ({ ...prev, defaultNetwork: e.target.value }));
                                toast({
                                    title: 'Session Network Selection',
                                    description: 'Default network selected for active session.',
                                    variant: 'default'
                                });
                            }}
                            className="w-full h-10 p-2.5 rounded-lg border border-border bg-card/40 text-xs text-foreground focus:border-primary focus:outline-none"
                        >
                            <option value="84532">Base Sepolia (Testnet)</option>
                            <option value="11155111">Sepolia Ethereum (Testnet)</option>
                            <option value="1">Ethereum Mainnet (Production)</option>
                        </select>
                    </div>
                </div>
            </Card>
        </div>
    );
};

// ==========================================
// 2. Wallet Preferences Tab
// ==========================================
export const WalletPreferencesTab: React.FC = () => {
    const { capabilities } = useCapabilityContext();
    const { switchChain, currentChainId } = useBackendSmartAccount();
    const { toast } = useToast();

    const [prefChain, setPrefChain] = useState(String(currentChainId));
    const [prefBundler, setPrefBundler] = useState('ALCHEMY');
    const [prefPaymaster, setPrefPaymaster] = useState('ALCHEMY');
    const [gasSponsorship, setGasSponsorship] = useState('SPONSORED');
    const [txMode, setTxMode] = useState('Standard');
    const [prefExplorer, setPrefExplorer] = useState('Blockscout');

    const [validating, setValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<{ compatible: boolean; message: string } | null>(null);

    // Sync preferred chain state when global chain changes
    useEffect(() => {
        setPrefChain(String(currentChainId));
    }, [currentChainId]);

    const handleSwitchChainPref = async (val: string) => {
        setPrefChain(val);
        try {
            await switchChain(parseInt(val));
            toast({
                title: 'Network Switched',
                description: `Switched active network to Chain ID: ${val}`,
                variant: 'success'
            });
        } catch (error) {
            console.error('Failed switching network:', error);
        }
    };

    const handleTestCompatibility = async () => {
        setValidating(true);
        setValidationResult(null);
        try {
            const response = await apiClient.validateCompatibility({
                bundlerID: prefBundler,
                paymasterID: prefPaymaster,
                walletID: 'LIGHT_ACCOUNT',
                chainId: parseInt(prefChain)
            });

            if (response.success && response.data) {
                setValidationResult({
                    compatible: response.data.compatible,
                    message: response.data.message || 'Configuration is compatible.'
                });
                toast({
                    title: response.data.compatible ? 'Compatibility Verified' : 'Validation Error',
                    description: response.data.message || 'Provider combination verified.',
                    variant: response.data.compatible ? 'success' : 'error'
                });
            } else {
                setValidationResult({
                    compatible: false,
                    message: response.error?.message || 'Capability checking failed.'
                });
            }
        } catch (error: unknown) {
            console.error('Failed checking compatibility:', error);
            const errMsg = error instanceof Error ? error.message : 'Network validation error.';
            setValidationResult({
                compatible: false,
                message: errMsg
            });
        } finally {
            setValidating(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="p-6">
                <div className="mb-6 pb-4 border-b border-border">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Globe className="w-5 h-5 text-primary" />
                        Wallet Preferences
                    </h3>
                    <p className="text-xs text-muted-foreground">Select preferred entrypoints, bundlers, and gas managers derived dynamically from backend capabilities.</p>
                </div>

                <Alert variant="warning" title="Feature Pending Backend Persistence">
                    Wallet preferences are applied to the current active session. Persistent profile preference storage is on the Backlog.
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {/* Chain selector */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Preferred Chain Context</label>
                        <select
                            value={prefChain}
                            onChange={(e) => handleSwitchChainPref(e.target.value)}
                            className="w-full h-10 p-2.5 rounded-lg border border-border bg-card/40 text-xs text-foreground focus:border-primary focus:outline-none"
                        >
                            {capabilities?.supportedChains.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                            ))}
                        </select>
                    </div>

                    {/* Explorer */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Preferred Block Explorer</label>
                        <select
                            value={prefExplorer}
                            onChange={(e) => setPrefExplorer(e.target.value)}
                            className="w-full h-10 p-2.5 rounded-lg border border-border bg-card/40 text-xs text-foreground focus:border-primary focus:outline-none"
                        >
                            <option value="Blockscout">Blockscout (Recommended)</option>
                            <option value="Etherscan">Etherscan</option>
                            <option value="None">None</option>
                        </select>
                    </div>

                    {/* Bundler selection */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Preferred ERC-4337 Bundler</label>
                        <select
                            value={prefBundler}
                            onChange={(e) => setPrefBundler(e.target.value)}
                            className="w-full h-10 p-2.5 rounded-lg border border-border bg-card/40 text-xs text-foreground focus:border-primary focus:outline-none"
                        >
                            {capabilities?.supportedBundlers.map(b => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                    </div>

                    {/* Paymaster Selection */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Preferred Paymaster (Gas Manager)</label>
                        <select
                            value={prefPaymaster}
                            onChange={(e) => setPrefPaymaster(e.target.value)}
                            className="w-full h-10 p-2.5 rounded-lg border border-border bg-card/40 text-xs text-foreground focus:border-primary focus:outline-none"
                        >
                            {capabilities?.supportedPaymasters.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>

                    {/* Default gas sponsorship */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Default Gas Sponsorship Mode</label>
                        <select
                            value={gasSponsorship}
                            onChange={(e) => setGasSponsorship(e.target.value)}
                            className="w-full h-10 p-2.5 rounded-lg border border-border bg-card/40 text-xs text-foreground focus:border-primary focus:outline-none"
                        >
                            <option value="SPONSORED">Sponsored Mode (Zero Gas Fee if Sponsor balance permits)</option>
                            <option value="USER_PAID">User Paid Mode (Signer pays gas fee in Native ETH)</option>
                        </select>
                    </div>

                    {/* Default transaction mode */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Default Transaction Speed Mode</label>
                        <select
                            value={txMode}
                            onChange={(e) => setTxMode(e.target.value)}
                            className="w-full h-10 p-2.5 rounded-lg border border-border bg-card/40 text-xs text-foreground focus:border-primary focus:outline-none"
                        >
                            <option value="Standard">Standard Execution (Avg 15-30s)</option>
                            <option value="High Priority">High Priority (Aggressive gas margins)</option>
                            <option value="Custom">Custom Gas Overrides</option>
                        </select>
                    </div>
                </div>

                {/* Compatibility validations */}
                <div className="mt-8 pt-6 border-t border-border/60">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h4 className="text-sm font-bold text-foreground">Verify Provider Compatibility</h4>
                            <p className="text-xs text-muted-foreground">Validate if your bundler, paymaster, chain ID and account schema configuration is fully compatible.</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleTestCompatibility}
                            loading={validating}
                            className="flex items-center gap-1.5"
                        >
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            Run Compatibility Check
                        </Button>
                    </div>

                    {validationResult && (
                        <div className="mt-4">
                            <Alert
                                variant={validationResult.compatible ? 'success' : 'danger'}
                                title={validationResult.compatible ? 'Configuration Fully Compatible' : 'Incompatible Provider Setup'}
                            >
                                {validationResult.message}
                            </Alert>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

// ==========================================
// 3. Transaction Preferences Tab
// ==========================================
export const TransactionPreferencesTab: React.FC = () => {
    const { toast } = useToast();

    const [txPrefs, setTxPrefs] = useState({
        autoGasEstimate: true,
        alwaysPreview: true,
        defaultBatchMode: false,
        defaultSessionKey: 'NONE',
        defaultConfirmationBehavior: 'standard',
        preferredOrdering: 'FIFO'
    });

    const handleToggle = (key: keyof typeof txPrefs) => {
        setTxPrefs(prev => {
            const next = { ...prev, [key]: !prev[key] };
            toast({
                title: 'Preference Updated',
                description: `${key} preference updated for the current session.`,
                variant: 'default'
            });
            return next;
        });
    };

    return (
        <div className="space-y-6">
            <Card className="p-6">
                <div className="mb-6 pb-4 border-b border-border">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        Transaction Preferences
                    </h3>
                    <p className="text-xs text-muted-foreground">Configure transaction handling thresholds, gas preview toggles, and execution priorities.</p>
                </div>

                <Alert variant="warning" title="Feature Pending Backend Persistence">
                    Transaction parameters are stored in memory for the active session. Long-term saving requires backend schema support (Backlog).
                </Alert>

                <div className="space-y-5 mt-6">
                    {/* Auto gas estimation */}
                    <div className="flex items-center justify-between p-3 bg-card/25 border border-border/40 rounded-lg">
                        <div>
                            <span className="text-xs font-bold text-foreground block">Auto Gas Estimation</span>
                            <span className="text-[10px] text-muted-foreground block max-w-lg mt-0.5">
                                Automatically query RPC endpoints to compute gas limits and user operation fees. Disabling allows manual gas overrides.
                            </span>
                        </div>
                        <Toggle 
                            checked={txPrefs.autoGasEstimate} 
                            onChange={() => handleToggle('autoGasEstimate')} 
                        />
                    </div>

                    {/* Always preview */}
                    <div className="flex items-center justify-between p-3 bg-card/25 border border-border/40 rounded-lg">
                        <div>
                            <span className="text-xs font-bold text-foreground block">Always Preview Transaction</span>
                            <span className="text-[10px] text-muted-foreground block max-w-lg mt-0.5">
                                Require a confirmation slide drawers before dispatching user operations. Prevents accidental double sends.
                            </span>
                        </div>
                        <Toggle 
                            checked={txPrefs.alwaysPreview} 
                            onChange={() => handleToggle('alwaysPreview')} 
                        />
                    </div>

                    {/* Batch mode */}
                    <FeatureGate 
                        feature="batching"
                        fallback={
                            <div className="flex items-center justify-between p-3 bg-muted/20 border border-border/30 rounded-lg opacity-60">
                                <div>
                                    <span className="text-xs font-bold text-muted-foreground block">Default Batch Mode</span>
                                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                                        Batch transactions are not supported by your active smart account capability registry.
                                    </span>
                                </div>
                                <span className="text-[9px] bg-muted px-2 py-0.5 rounded text-muted-foreground">Unavailable</span>
                            </div>
                        }
                    >
                        <div className="flex items-center justify-between p-3 bg-card/25 border border-border/40 rounded-lg">
                            <div>
                                <span className="text-xs font-bold text-foreground block">Default Batch Mode</span>
                                <span className="text-[10px] text-muted-foreground block max-w-lg mt-0.5">
                                    Queue multiple user operations and bundle them into a single multicall block. Saves network gas fees.
                                </span>
                            </div>
                            <Toggle 
                                checked={txPrefs.defaultBatchMode} 
                                onChange={() => handleToggle('defaultBatchMode')} 
                            />
                        </div>
                    </FeatureGate>

                    {/* Default session key */}
                    <FeatureGate
                        feature="sessionKeys"
                        fallback={
                            <div className="p-3 bg-muted/20 border border-border/30 rounded-lg opacity-60 grid grid-cols-1 gap-1">
                                <span className="text-xs font-bold text-muted-foreground block">Default Session Signer</span>
                                <span className="text-[10px] text-muted-foreground">
                                    Session key module is not enabled or supported by your active smart account context.
                                </span>
                            </div>
                        }
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-card/25 border border-border/40 rounded-lg items-center">
                            <div>
                                <span className="text-xs font-bold text-foreground block">Default Session Key</span>
                                <span className="text-[10px] text-muted-foreground block max-w-lg mt-0.5">
                                    Pre-select an authorized session key public signer to handle standard transactions without hardware prompts.
                                </span>
                            </div>
                            <select
                                value={txPrefs.defaultSessionKey}
                                onChange={(e) => {
                                    setTxPrefs(prev => ({ ...prev, defaultSessionKey: e.target.value }));
                                    toast({ title: 'Signer Changed', description: 'Session signer pre-selection updated.', variant: 'default' });
                                }}
                                className="h-9 p-2 rounded border border-border bg-card/45 text-xs text-foreground focus:outline-none"
                            >
                                <option value="NONE">None (Require Signer Prompt)</option>
                                <option value="AUTO_GENERATED">Active Session Signer (Ephemeral)</option>
                            </select>
                        </div>
                    </FeatureGate>

                    {/* Preferred ordering */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-card/25 border border-border/40 rounded-lg items-center">
                        <div>
                            <span className="text-xs font-bold text-foreground block">Preferred Transaction Queue Order</span>
                            <span className="text-[10px] text-muted-foreground block max-w-lg mt-0.5">
                                Control how multi-operation queues are ordered inside localized batch frames.
                            </span>
                        </div>
                        <select
                            value={txPrefs.preferredOrdering}
                            onChange={(e) => {
                                setTxPrefs(prev => ({ ...prev, preferredOrdering: e.target.value }));
                                toast({ title: 'Ordering Pre-set', description: 'Priority ordering configured.', variant: 'default' });
                            }}
                            className="h-9 p-2 rounded border border-border bg-card/45 text-xs text-foreground focus:outline-none"
                        >
                            <option value="FIFO">First-In-First-Out (FIFO) - Chronological</option>
                            <option value="LIFO">Last-In-First-Out (LIFO) - Stacked</option>
                        </select>
                    </div>
                </div>
            </Card>
        </div>
    );
};

// ==========================================
// 4. Notification Preferences Tab
// ==========================================
export const NotificationPreferencesTab: React.FC = () => {
    const { user, token, checkAuthStatus } = useBackendSmartAccount();
    const { toast } = useToast();
    const dispatch = useDispatch();
    const [saving, setSaving] = useState(false);

    // Binds to profile.preferences.notifications
    const [globalNotify, setGlobalNotify] = useState(user?.preferences?.notifications ?? true);

    // Fine grained triggers (backlog UI toggles)
    const [triggers, setTriggers] = useState({
        txConfirmed: true,
        txFailed: true,
        sessionExpiry: true,
        deployCompleted: true,
        securityAlerts: true,
        sponsorshipFailures: true,
        maintenance: false
    });

    useEffect(() => {
        if (user?.preferences) {
            setGlobalNotify(user.preferences.notifications ?? true);
        }
    }, [user]);

    const handleSaveGlobal = async (checked: boolean) => {
        setGlobalNotify(checked);
        if (!token || !user) return;

        setSaving(true);
        try {
            const updatedPreferences = {
                ...(user.preferences || {}),
                notifications: checked,
                privacy: user.preferences?.privacy || { showEmail: false, showOnlineStatus: true }
            };

            const response = await apiClient.updateProfile(token, {
                username: user.username,
                displayName: user.displayName,
                preferences: updatedPreferences
            });

            if (response.success && response.data) {
                dispatch(setAuthData({ user: response.data, token }));
                toast({
                    title: 'Notifications Updated',
                    description: `Global notifications ${checked ? 'enabled' : 'disabled'}.`,
                    variant: 'success'
                });
                await checkAuthStatus();
            }
        } catch (error) {
            console.error('Failed updating notify prefs:', error);
            toast({ title: 'Error Saving Settings', description: 'Connection error.', variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleTriggerChange = (key: keyof typeof triggers) => {
        setTriggers(prev => ({ ...prev, [key]: !prev[key] }));
        toast({
            title: 'Rule Configured',
            description: 'Trigger rule updated for session.',
            variant: 'default'
        });
    };

    return (
        <div className="space-y-6">
            <Card className="p-6">
                <div className="mb-6 pb-4 border-b border-border flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Bell className="w-5 h-5 text-primary" />
                            Notification Center
                        </h3>
                        <p className="text-xs text-muted-foreground">Manage real-time subscription notifications and alert limits for critical on-chain events.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {saving && <span className="text-[10px] text-muted-foreground">Saving...</span>}
                        <Toggle 
                            checked={globalNotify} 
                            onChange={handleSaveGlobal} 
                            disabled={saving}
                        />
                    </div>
                </div>

                <Alert variant="info" title="Granular Rules Pending Persistence">
                    Fine-grained trigger alerts are stored locally for active session context. Binds to global toggle: updating global toggle saves instantly to your production profile.
                </Alert>

                <div className="mt-6 space-y-4">
                    {/* Tx confirmation */}
                    <div className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        globalNotify ? 'bg-card/25 border-border/40' : 'bg-muted/10 border-border/20 opacity-55 pointer-events-none'
                    }`}>
                        <div>
                            <span className="text-xs font-bold text-foreground block">Transaction Confirmations</span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">Notify immediately when user operations are successfully mined on-chain.</span>
                        </div>
                        <Toggle 
                            checked={triggers.txConfirmed} 
                            onChange={() => handleTriggerChange('txConfirmed')} 
                            disabled={!globalNotify}
                        />
                    </div>

                    {/* Tx failed */}
                    <div className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        globalNotify ? 'bg-card/25 border-border/40' : 'bg-muted/10 border-border/20 opacity-55 pointer-events-none'
                    }`}>
                        <div>
                            <span className="text-xs font-bold text-foreground block">Failed Transactions</span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">Alert immediately if gas limits are breached or operations revert on-chain.</span>
                        </div>
                        <Toggle 
                            checked={triggers.txFailed} 
                            onChange={() => handleTriggerChange('txFailed')} 
                            disabled={!globalNotify}
                        />
                    </div>

                    {/* Session keys */}
                    <div className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        globalNotify ? 'bg-card/25 border-border/40' : 'bg-muted/10 border-border/20 opacity-55 pointer-events-none'
                    }`}>
                        <div>
                            <span className="text-xs font-bold text-foreground block">Session Key Expirations</span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">Notify when active delegation signers have less than 24 hours validity remaining.</span>
                        </div>
                        <Toggle 
                            checked={triggers.sessionExpiry} 
                            onChange={() => handleTriggerChange('sessionExpiry')} 
                            disabled={!globalNotify}
                        />
                    </div>

                    {/* Deployed */}
                    <div className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        globalNotify ? 'bg-card/25 border-border/40' : 'bg-muted/10 border-border/20 opacity-55 pointer-events-none'
                    }`}>
                        <div>
                            <span className="text-xs font-bold text-foreground block">Smart Wallet Deployments</span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">Send a confirmation alert when account initialization/deployment finishes.</span>
                        </div>
                        <Toggle 
                            checked={triggers.deployCompleted} 
                            onChange={() => handleTriggerChange('deployCompleted')} 
                            disabled={!globalNotify}
                        />
                    </div>

                    {/* Security alerts */}
                    <div className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        globalNotify ? 'bg-card/25 border-border/40' : 'bg-muted/10 border-border/20 opacity-55 pointer-events-none'
                    }`}>
                        <div>
                            <span className="text-xs font-bold text-foreground block">Security & Policy Alerts</span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">High-priority warning if a key is revoked, or private keys are generated.</span>
                        </div>
                        <Toggle 
                            checked={triggers.securityAlerts} 
                            onChange={() => handleTriggerChange('securityAlerts')} 
                            disabled={!globalNotify}
                        />
                    </div>

                    {/* Gas sponsorship alerts */}
                    <div className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        globalNotify ? 'bg-card/25 border-border/40' : 'bg-muted/10 border-border/20 opacity-55 pointer-events-none'
                    }`}>
                        <div>
                            <span className="text-xs font-bold text-foreground block">Sponsorship & Paymaster Failures</span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">Receive alert if the paymaster sponsor balance runs dry, causing sponsorship rejections.</span>
                        </div>
                        <Toggle 
                            checked={triggers.sponsorshipFailures} 
                            onChange={() => handleTriggerChange('sponsorshipFailures')} 
                            disabled={!globalNotify}
                        />
                    </div>
                </div>
            </Card>
        </div>
    );
};

// ==========================================
// 5. Appearance Settings Tab
// ==========================================
export const AppearancePreferencesTab: React.FC = () => {
    const { theme, setTheme } = useTheme();
    const { toast } = useToast();

    const [density, setDensity] = useState(() => localStorage.getItem('nexus-ui-density') || 'comfortable');
    const [tableDensity, setTableDensity] = useState(() => localStorage.getItem('nexus-ui-table-density') || 'comfortable');
    const [animations, setAnimations] = useState(() => localStorage.getItem('nexus-ui-animations') || 'enabled');
    const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem('nexus-ui-reduced-motion') || 'system');

    // Sync animation overrides
    useEffect(() => {
        const root = document.documentElement;
        if (animations === 'disabled') {
            root.classList.add('disable-animations');
        } else {
            root.classList.remove('disable-animations');
        }
    }, [animations]);

    const handlePrefChange = (key: string, val: string, setter: (v: string) => void) => {
        setter(val);
        localStorage.setItem(`nexus-ui-${key}`, val);
        window.dispatchEvent(new Event('storage'));
        toast({
            title: 'Theme & Layout Updated',
            description: `${key.replace('-', ' ')} preference updated instantly.`,
            variant: 'success'
        });
    };

    return (
        <div className="space-y-6">
            <Card className="p-6">
                <div className="mb-6 pb-4 border-b border-border">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Palette className="w-5 h-5 text-primary" />
                        Appearance Preferences
                    </h3>
                    <p className="text-xs text-muted-foreground">Customize localized styling tokens, margins, grid spaces, color modes, and animations.</p>
                </div>

                <div className="space-y-6">
                    {/* Theme Mode */}
                    <div>
                        <label className="text-xs font-semibold text-foreground block mb-2">Color Theme Mode</label>
                        <div className="grid grid-cols-3 gap-3">
                            {([
                                { key: 'light', label: 'Light Mode' },
                                { key: 'dark', label: 'Dark Mode (Default)' },
                                { key: 'system', label: 'System Sync' }
                            ] as const).map((opt) => {
                                const active = theme === opt.key;
                                return (
                                    <button
                                        key={opt.key}
                                        type="button"
                                        onClick={() => setTheme(opt.key)}
                                        className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
                                            active
                                                ? 'border-primary bg-primary/10 text-primary shadow-xs'
                                                : 'border-border bg-card/40 text-muted-foreground hover:text-foreground hover:border-border/80'
                                        }`}
                                    >
                                        <span className="text-xs font-bold capitalize">{opt.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Spacing density */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Content Spacing Density</label>
                            <select
                                value={density}
                                onChange={(e) => handlePrefChange('density', e.target.value, setDensity)}
                                className="w-full h-10 p-2.5 rounded-lg border border-border bg-card/40 text-xs text-foreground focus:outline-none"
                            >
                                <option value="comfortable">Comfortable Spacing</option>
                                <option value="compact">Compact Spacing (Smaller padding & margin)</option>
                            </select>
                        </div>

                        {/* Table Density */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Table Row Padding Density</label>
                            <select
                                value={tableDensity}
                                onChange={(e) => handlePrefChange('table-density', e.target.value, setTableDensity)}
                                className="w-full h-10 p-2.5 rounded-lg border border-border bg-card/40 text-xs text-foreground focus:outline-none"
                            >
                                <option value="comfortable">Comfortable Rows (Spacious layout)</option>
                                <option value="compact">Compact Rows (Highly readable spreadsheets)</option>
                            </select>
                        </div>

                        {/* Animations */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">UI Animations & Transitions</label>
                            <select
                                value={animations}
                                onChange={(e) => handlePrefChange('animations', e.target.value, setAnimations)}
                                className="w-full h-10 p-2.5 rounded-lg border border-border bg-card/40 text-xs text-foreground focus:outline-none"
                            >
                                <option value="enabled">Enabled (Smooth motion transitions)</option>
                                <option value="disabled">Disabled (Disable all page animation transitions)</option>
                            </select>
                        </div>

                        {/* Reduced motion */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Accessibility Reduced Motion</label>
                            <select
                                value={reducedMotion}
                                onChange={(e) => handlePrefChange('reduced-motion', e.target.value, setReducedMotion)}
                                className="w-full h-10 p-2.5 rounded-lg border border-border bg-card/40 text-xs text-foreground focus:outline-none"
                            >
                                <option value="system">Auto (Detect system preferences)</option>
                                <option value="enabled">Force Reduced Motion (Limit high-contrast transitions)</option>
                                <option value="disabled">Normal (Render full web3 transitions)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

// ==========================================
// 6. Advanced Technical Configuration Tab
// ==========================================
export const AdvancedConfigTab: React.FC = () => {
    const { capabilities } = useCapabilityContext();
    const { currentChainId, accountInfo } = useBackendSmartAccount();
    const [matrixVisible, setMatrixVisible] = useState(false);

    return (
        <div className="space-y-6">
            <Card className="p-6">
                <div className="mb-6 pb-4 border-b border-border flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Terminal className="w-5 h-5 text-primary" />
                            Advanced System Configurations
                        </h3>
                        <p className="text-xs text-muted-foreground">Technical properties, contract addresses, and feature matrix parameters of active Smart Account.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
                    <div className="p-4 bg-muted/10 border border-border/40 rounded-xl space-y-3">
                        <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5">
                            <Cpu className="w-4 h-4 text-primary" />
                            EIP-4337 Wallet Infrastructure
                        </h4>
                        <div className="space-y-2 font-mono text-[11px]">
                            <div className="flex justify-between border-b border-border/30 pb-1.5">
                                <span className="text-muted-foreground">EntryPoint Version:</span>
                                <span className="text-foreground">0.6.0 (Production verified)</span>
                            </div>
                            <div className="flex justify-between border-b border-border/30 pb-1.5">
                                <span className="text-muted-foreground">Supported ERC-4337 spec:</span>
                                <span className="text-foreground">v0.6</span>
                            </div>
                            <div className="flex justify-between border-b border-border/30 pb-1.5">
                                <span className="text-muted-foreground">Smart Account Blueprint:</span>
                                <span className="text-foreground">Light Account (Alchemy)</span>
                            </div>
                            <div className="flex justify-between border-b border-border/30 pb-1.5">
                                <span className="text-muted-foreground">SDK Wallet Framework:</span>
                                <span className="text-foreground">@aa-sdk/core (v4.52.0)</span>
                            </div>
                            <div className="flex justify-between pb-0">
                                <span className="text-muted-foreground">Factory Contract Type:</span>
                                <span className="text-foreground truncate max-w-[140px]" title="LightAccountFactory v0.6">LightAccountFactory (0.6)</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-muted/10 border border-border/40 rounded-xl space-y-3">
                        <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5">
                            <Globe className="w-4 h-4 text-primary" />
                            Active Provider Setup
                        </h4>
                        <div className="space-y-2 font-mono text-[11px]">
                            <div className="flex justify-between border-b border-border/30 pb-1.5">
                                <span className="text-muted-foreground">Active Chain ID:</span>
                                <span className="text-foreground">{currentChainId}</span>
                            </div>
                            <div className="flex justify-between border-b border-border/30 pb-1.5">
                                <span className="text-muted-foreground">Active Bundler Node:</span>
                                <span className="text-foreground">Alchemy Bundler Proxy</span>
                            </div>
                            <div className="flex justify-between border-b border-border/30 pb-1.5">
                                <span className="text-muted-foreground">Active Gas Manager:</span>
                                <span className="text-foreground">Alchemy Paymaster (Sponsored Mode)</span>
                            </div>
                            <div className="flex justify-between border-b border-border/30 pb-1.5">
                                <span className="text-muted-foreground">Signer Configuration:</span>
                                <span className="text-foreground">{accountInfo?.signerAddress === 'CENTRAL_WALLET' ? 'Portal Custody' : 'Externally Connected'}</span>
                            </div>
                            <div className="flex justify-between pb-0">
                                <span className="text-muted-foreground">Wallet Type ID:</span>
                                <span className="text-foreground">{accountInfo?.walletID || 'LIGHT_ACCOUNT'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature capability matrix */}
                <div className="mt-6 border border-border/40 rounded-xl overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setMatrixVisible(!matrixVisible)}
                        className="w-full p-4 bg-muted/15 hover:bg-muted/20 text-xs font-bold text-foreground flex justify-between items-center transition-colors focus:outline-none"
                    >
                        <span className="flex items-center gap-1.5">
                            <Layers3 className="w-4 h-4 text-primary" />
                            Technical Feature Capability Matrix
                        </span>
                        <span className="text-[10px] text-primary">{matrixVisible ? 'Collapse' : 'Expand Details'}</span>
                    </button>

                    {matrixVisible && (
                        <div className="p-4 border-t border-border/40 bg-card/25 divide-y divide-border/30 font-mono text-[10px] text-slate-300">
                            <div className="flex justify-between py-2">
                                <span className="flex items-center gap-1">
                                    <Key className="w-3.5 h-3.5 text-muted-foreground" /> Session Signer Delegation (EIP-7715 / EIP-4337)
                                </span>
                                <span className={capabilities?.sessionKeySupport ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                                    {capabilities?.sessionKeySupport ? '✓ SUPPORTED' : '✗ UNSUPPORTED'}
                                </span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="flex items-center gap-1">
                                    <Layers className="w-3.5 h-3.5 text-muted-foreground" /> Multicall Operation Batching (Batching)
                                </span>
                                <span className={capabilities?.batchingSupport ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                                    {capabilities?.batchingSupport ? '✓ SUPPORTED' : '✗ UNSUPPORTED'}
                                </span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="flex items-center gap-1">
                                    <Flame className="w-3.5 h-3.5 text-muted-foreground" /> Gas Sponsorship (Sponsored Paymaster Rules)
                                </span>
                                <span className={capabilities?.gasSponsorshipSupport ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                                    {capabilities?.gasSponsorshipSupport ? '✓ SUPPORTED' : '✗ UNSUPPORTED'}
                                </span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="flex items-center gap-1">
                                    <Activity className="w-3.5 h-3.5 text-muted-foreground" /> Counterfactual Deployment on First Operation
                                </span>
                                <span className={capabilities?.deploymentSupport ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                                    {capabilities?.deploymentSupport ? '✓ SUPPORTED' : '✗ UNSUPPORTED'}
                                </span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" /> Guardian Multisig Sign-off
                                </span>
                                <span className="text-yellow-500 font-bold">BACKLOG (PENDING ENDPOINT)</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="flex items-center gap-1">
                                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" /> Social Recovery Signers
                                </span>
                                <span className="text-yellow-500 font-bold">BACKLOG (PENDING CONTRACT)</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="flex items-center gap-1">
                                    <Settings2 className="w-3.5 h-3.5 text-muted-foreground" /> Multiple Bundlers
                                </span>
                                <span className="text-emerald-400 font-bold">SUPPORTED ({capabilities?.supportedBundlers.length || 0})</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="flex items-center gap-1">
                                    <Globe className="w-3.5 h-3.5 text-muted-foreground" /> Multiple Gas Sponsors (Paymasters)
                                </span>
                                <span className="text-emerald-400 font-bold">SUPPORTED ({capabilities?.supportedPaymasters.length || 0})</span>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

// ==========================================
// 7. System Preferences Tab (Import/Export/Reset)
// ==========================================
export const SystemPreferencesTab: React.FC = () => {
    return (
        <div className="space-y-6">
            <Card className="p-6">
                <div className="mb-6 pb-4 border-b border-border">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-primary" />
                        System Settings
                    </h3>
                    <p className="text-xs text-muted-foreground">Export your smart wallet profile configuration parameters, or restore system backups.</p>
                </div>

                <Alert variant="warning" title="Backend Import/Export Pending Support">
                    Backend endpoints for profile configuration backups (`/api/profile/export`, `/api/profile/import`) are currently on the Backlog. Do not input backup keys or restore local configs.
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="p-4 bg-muted/15 border border-border/50 rounded-xl space-y-3 text-center">
                        <Download className="w-8 h-8 text-primary mx-auto" />
                        <h4 className="font-bold text-sm text-foreground">Export Configuration</h4>
                        <p className="text-[10px] text-muted-foreground">Download a secure JSON file containing your active settings preferences.</p>
                        <Button variant="outline" size="sm" className="w-full text-xs" disabled={true}>
                            Export JSON
                        </Button>
                    </div>

                    <div className="p-4 bg-muted/15 border border-border/50 rounded-xl space-y-3 text-center">
                        <Upload className="w-8 h-8 text-secondary mx-auto" />
                        <h4 className="font-bold text-sm text-foreground">Import Configuration</h4>
                        <p className="text-[10px] text-muted-foreground">Restore your profile and defaults by uploading a settings configuration backup file.</p>
                        <Button variant="outline" size="sm" className="w-full text-xs" disabled={true}>
                            Upload File
                        </Button>
                    </div>

                    <div className="p-4 bg-muted/15 border border-border/50 rounded-xl space-y-3 text-center">
                        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto animate-pulse" />
                        <h4 className="font-bold text-sm text-foreground">Reset Configuration</h4>
                        <p className="text-[10px] text-muted-foreground">Clear active session configurations and restore factory-default profiles.</p>
                        <Button variant="outline" size="sm" className="w-full text-xs hover:border-red-500 hover:text-red-400" disabled={true}>
                            Reset defaults
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

// ==========================================
// Backward compatibility wrapper for old import
// ==========================================
export const UserProfile: React.FC = () => {
    return <UserProfileTab />;
};