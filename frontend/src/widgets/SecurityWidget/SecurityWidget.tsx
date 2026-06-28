import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Section } from '@/app/layouts/Layout';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/ui/Dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/shared/ui/Table';
import { useBackendSmartAccount } from '@/entities/wallet/hooks/useBackendSmartAccount';
import { useSessionKeys } from '@/entities/sessionKey/hooks/useSessionKeys';
import { useNotificationPipeline } from '@/app/providers/NotificationContext';
import { FeatureGate } from '@/entities/capability/ui/FeatureGate';
import { useToast } from '@/shared/hooks/useToast';
import { encryptPrivateKey } from '@/shared/lib/crypto';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { 
    Shield, ShieldAlert, ShieldCheck, Key, Plus, 
    Clock, Copy, AlertTriangle, Network, AlertCircle,
    Cpu, FileText, Calendar
} from 'lucide-react';
import { getChainById } from '@/app/config/chains';

export const SecurityWidget: React.FC = () => {
    const { 
        smartAccountAddress, 
        currentChainId, 
        isDeployed, 
        accountInfo, 
        isAuthenticated
    } = useBackendSmartAccount();
    
    const { 
        sessionKeys, 
        isLoading, 
        isCreating, 
        isRevoking, 
        fetchSessionKeys, 
        createSessionKey, 
        revokeSessionKey,
        activeSessionKeys,
        expiredSessionKeys
    } = useSessionKeys();

    const { notifications } = useNotificationPipeline();
    const { toast } = useToast();

    // Local state for tabs and creation forms
    const [activeTab, setActiveTab] = useState<'dashboard' | 'sessionKeys' | 'timeline'>('dashboard');
    const [selectedKey, setSelectedKey] = useState<any | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [liveAnnouncement, setLiveAnnouncement] = useState('');
    const [showRawMetadata, setShowRawMetadata] = useState(false);

    // Form inputs for session key creation
    const [customKeyAddress, setCustomKeyAddress] = useState('');
    const [customName, setCustomName] = useState('');
    const [customTarget, setCustomTarget] = useState('');
    const [customSpendingLimit, setCustomSpendingLimit] = useState('0.01');
    const [customExpiry, setCustomExpiry] = useState('86400'); // Default 1 day in seconds
    const [generatedPrivate, setGeneratedPrivate] = useState<string | null>(null);

    // Filter timeline notifications (only show security-related types)
    const securityEvents = useMemo(() => {
        return notifications.filter(n => 
            ['deployment.complete', 'session.expired', 'sponsorship.rejected', 'transaction.failed'].includes(n.type)
        );
    }, [notifications]);

    // Handle session key pair generation
    const handleGenerateKeypair = () => {
        try {
            const privateKey = generatePrivateKey();
            const account = privateKeyToAccount(privateKey);
            setCustomKeyAddress(account.address);
            setGeneratedPrivate(privateKey);
            setLiveAnnouncement('Generated new ephemeral keypair. Save the private key before submitting.');
            toast({
                title: 'Keypair Generated',
                description: 'New temporary session signer address generated.',
                variant: 'success'
            });
        } catch (err) {
            console.error('Failed to generate keypair:', err);
        }
    };

    // Copy action
    const handleCopy = (txt: string, label: string) => {
        navigator.clipboard.writeText(txt);
        setLiveAnnouncement(`${label} copied to clipboard.`);
        toast({
            title: 'Copied',
            description: `${label} copied to clipboard`,
            variant: 'success'
        });
    };

    // Calculate dynamic security score with fully documented logic
    const scoreBreakdown = useMemo(() => {
        let score = 100;
        const deductions: { reason: string; points: number }[] = [];

        // 1. Check Smart Account Deployment
        if (!isDeployed) {
            score -= 15;
            deductions.push({ reason: 'Smart Account counterfactual (not deployed on-chain)', points: 15 });
        }

        // 2. Check Session Keys configuration status
        if (sessionKeys.length === 0) {
            score -= 15;
            deductions.push({ reason: 'No active session keys (recommended for external service access)', points: 15 });
        } else {
            // Unrestricted session keys check
            const hasUnrestricted = sessionKeys.some(k => 
                k.isActive && (!k.allowedTargets || k.allowedTargets.length === 0 || k.spendingLimit === '0')
            );
            if (hasUnrestricted) {
                score -= 15;
                deductions.push({ reason: 'Active session keys lack restricted target policy scopes', points: 15 });
            }

            // Expired but unrevoked check
            if (expiredSessionKeys.length > 0) {
                score -= 10;
                deductions.push({ reason: 'Expired keys remain on ledger (recommend revoking)', points: 10 });
            }
        }

        // 3. Daily Spending Limits Config
        const hasLimits = sessionKeys.some(k => k.isActive && parseFloat(k.spendingLimit) > 0);
        if (sessionKeys.length > 0 && !hasLimits) {
            score -= 15;
            deductions.push({ reason: 'All configured session keys lack spending allowances', points: 15 });
        }

        return {
            score: Math.max(score, 0),
            deductions
        };
    }, [isDeployed, sessionKeys, expiredSessionKeys]);

    // Handle form submission to create key
    const handleCreateKey = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customKeyAddress.trim()) {
            toast({ title: 'Input Error', description: 'Session key public address is required.', variant: 'error' });
            return;
        }

        try {
            const targets = customTarget.trim() ? [customTarget.trim()] : undefined;
            const expirySec = parseInt(customExpiry);
            const expiryTimestamp = Math.floor(Date.now() / 1000) + expirySec;

            setLiveAnnouncement('Submitting session key registration...');
            await createSessionKey({
                sessionKey: customKeyAddress.trim(),
                spendingLimit: customSpendingLimit,
                dailyLimit: customSpendingLimit,
                expiryTime: expiryTimestamp,
                allowedTargets: targets
            });

            if (generatedPrivate) {
                localStorage.setItem(`nexus-session-pk-${customKeyAddress.trim().toLowerCase()}`, encryptPrivateKey(generatedPrivate));
            }

            // Reset inputs
            setCustomKeyAddress('');
            setCustomName('');
            setCustomTarget('');
            setCustomSpendingLimit('0.01');
            setGeneratedPrivate(null);
            setIsCreateOpen(false);
            setLiveAnnouncement('Session key registered successfully.');
            fetchSessionKeys();
        } catch (err: any) {
            console.error('Failed to register session key:', err);
            setLiveAnnouncement(`Registration failed: ${err.message}`);
        }
    };

    const handleRevoke = async (publicKey: string) => {
        try {
            setLiveAnnouncement('Revoking session key...');
            await revokeSessionKey(publicKey);
            setLiveAnnouncement('Session key revoked successfully.');
            fetchSessionKeys();
        } catch (err: any) {
            console.error('Revocation failed:', err);
            setLiveAnnouncement(`Revocation failed: ${err.message}`);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 85) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
        if (score >= 60) return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
        return 'text-red-400 border-red-500/20 bg-red-500/5';
    };

    const activeChainConfig = getChainById(currentChainId);

    // Compute derived metrics
    const derivedMetrics = useMemo(() => {
        const expiringSoon = activeSessionKeys.filter(k => {
            const now = Math.floor(Date.now() / 1000);
            const diff = k.expiryTime - now;
            return diff > 0 && diff < 86400; // < 24 hours
        }).length;

        // Spending limits sum
        const totalAllowance = activeSessionKeys.reduce((sum, k) => {
            try {
                return sum + parseFloat(k.spendingLimit);
            } catch {
                return sum;
            }
        }, 0);

        // Authorized unique contracts count
        const uniqueTargets = new Set();
        activeSessionKeys.forEach(k => {
            k.allowedTargets?.forEach(t => uniqueTargets.add(t.toLowerCase()));
        });

        return {
            expiringSoon,
            totalAllowance,
            authorizedContracts: uniqueTargets.size
        };
    }, [activeSessionKeys]);

    return (
        <>
            {/* Visually hidden screen reader status announcements */}
            <div className="sr-only" aria-live="polite" role="status">
                {liveAnnouncement}
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 mb-6 text-sm font-semibold">
                <button
                    onClick={() => { setActiveTab('dashboard'); setLiveAnnouncement('Switched to Security Dashboard view.'); }}
                    className={`py-3 px-4 border-b-2 transition-all ${activeTab === 'dashboard' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    Dashboard
                </button>
                <button
                    onClick={() => { setActiveTab('sessionKeys'); setLiveAnnouncement('Switched to Session Keys list view.'); }}
                    className={`py-3 px-4 border-b-2 transition-all ${activeTab === 'sessionKeys' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    Session Keys ({sessionKeys.length})
                </button>
                <button
                    onClick={() => { setActiveTab('timeline'); setLiveAnnouncement('Switched to Security Event Timeline view.'); }}
                    className={`py-3 px-4 border-b-2 transition-all ${activeTab === 'timeline' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    Logs Feed ({securityEvents.length})
                </button>
            </div>

            {/* Conditional Authentication Error */}
            {!isAuthenticated && (
                <Card className="p-8 border border-red-500/20 bg-red-500/5 text-center mb-8">
                    <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <h4 className="font-bold text-slate-100 text-sm font-semibold">Authentication Token Required</h4>
                    <p className="text-xs text-slate-400 mt-1">Please log in to query active device credentials and delegation policies.</p>
                </Card>
            )}

            {isAuthenticated && (
                <AnimatePresence mode="wait">
                    {/* tab 1: SECURITY DASHBOARD */}
                    {activeTab === 'dashboard' && (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Score and Overview Banner */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <Card className={`p-6 border flex flex-col justify-between ${getScoreColor(scoreBreakdown.score)}`}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Shield className="w-5 h-5 shrink-0" />
                                            <span className="text-[10px] uppercase font-bold tracking-wider">Account Security Score</span>
                                        </div>
                                        <div className="text-5xl font-black">{scoreBreakdown.score} <span className="text-lg font-medium text-slate-400">/ 100</span></div>
                                        <p className="text-xs text-slate-400 mt-2 font-medium leading-relaxed">
                                            Vulnerability calculation derived dynamically using ERC-4337 deployment statuses, delegation boundaries, and expired key revocation records.
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] font-semibold text-slate-400">
                                        Confidence: <span className="text-emerald-400">High (Calculated)</span>
                                    </div>
                                </Card>

                                <Card className="p-6 bg-slate-900/40 border border-slate-800/80 lg:col-span-2 flex flex-col justify-between">
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2 block">Scoring Breakdown & Audits</span>
                                        {scoreBreakdown.deductions.length === 0 ? (
                                            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg mt-2">
                                                <ShieldCheck className="w-4 h-4 shrink-0" />
                                                <span>Your wallet configuration follows all counterfactual and session delegation security standards! Excellent work.</span>
                                            </div>
                                        ) : (
                                            <ul className="space-y-2 mt-2">
                                                {scoreBreakdown.deductions.map((ded, i) => (
                                                    <li key={i} className="flex justify-between items-start text-xs border-b border-slate-800/60 pb-1.5 last:border-0 last:pb-0">
                                                        <span className="text-slate-400 flex items-center gap-1.5">
                                                            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                            {ded.reason}
                                                        </span>
                                                        <span className="text-amber-500 font-bold shrink-0">-{ded.points} pts</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground mt-4 italic">
                                        Scoring Engine v1.0.0 (Deterministic, Transparent)
                                    </div>
                                </Card>
                            </div>

                            {/* Dashboard stats overview grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Card className="p-4 bg-slate-900/20 border border-slate-800 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0">
                                        <Key className="w-4.5 h-4.5" />
                                    </div>
                                    <div>
                                        <span className="text-[9px] uppercase font-bold text-muted-foreground block">Active Keys</span>
                                        <span className="text-lg font-bold text-slate-100">{activeSessionKeys.length}</span>
                                    </div>
                                </Card>
                                <Card className="p-4 bg-slate-900/20 border border-slate-800 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-red-500/15 flex items-center justify-center text-red-400 shrink-0">
                                        <Clock className="w-4.5 h-4.5" />
                                    </div>
                                    <div>
                                        <span className="text-[9px] uppercase font-bold text-muted-foreground block">Expired Keys</span>
                                        <span className="text-lg font-bold text-slate-100">{expiredSessionKeys.length}</span>
                                    </div>
                                </Card>
                                <Card className="p-4 bg-slate-900/20 border border-slate-800 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400 shrink-0">
                                        <AlertTriangle className="w-4.5 h-4.5" />
                                    </div>
                                    <div>
                                        <span className="text-[9px] uppercase font-bold text-muted-foreground block">Expiring Soon</span>
                                        <span className="text-lg font-bold text-slate-100">{derivedMetrics.expiringSoon}</span>
                                    </div>
                                </Card>
                                <Card className="p-4 bg-slate-900/20 border border-slate-800 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400 shrink-0">
                                        <Network className="w-4.5 h-4.5" />
                                    </div>
                                    <div>
                                        <span className="text-[9px] uppercase font-bold text-muted-foreground block">Allowed Targets</span>
                                        <span className="text-lg font-bold text-slate-100">{derivedMetrics.authorizedContracts}</span>
                                    </div>
                                </Card>
                            </div>

                            {/* Smart Account status inspection */}
                            <Section title="Account Metadata Configuration">
                                <Card className="p-5 bg-slate-900/20 border border-slate-800 space-y-4">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-slate-800">
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-200">Active Wallet Address</h4>
                                            <span className="font-mono text-xs text-muted-foreground mt-0.5 block truncate max-w-md">{smartAccountAddress || 'None'}</span>
                                        </div>
                                        <div className="shrink-0 flex items-center gap-2">
                                            <FeatureGate feature="deployment">
                                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold ${isDeployed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                                    {isDeployed ? 'Deployed on-chain' : 'Counterfactual (Un-deployed)'}
                                                </span>
                                            </FeatureGate>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-300">
                                        <div>
                                            <span className="text-muted-foreground text-[9px] uppercase tracking-wider block font-bold">Execution Entrypoint</span>
                                            <span className="mt-0.5 block font-mono">v0.6.0 (ERC-4337 standard)</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground text-[9px] uppercase tracking-wider block font-bold">Custodial Signer Configuration</span>
                                            <span className="mt-0.5 block font-mono text-slate-100">
                                                {accountInfo?.signerAddress === 'CENTRAL_WALLET' ? 'Custodial Portal (Central Signer)' : 'External Wallet'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground text-[9px] uppercase tracking-wider block font-bold">Network Context</span>
                                            <span className="mt-0.5 block font-mono">
                                                {activeChainConfig?.name || `Chain ID ${currentChainId}`}
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            </Section>
                        </motion.div>
                    )}

                    {/* tab 2: SESSION KEY MANAGEMENT */}
                    {activeTab === 'sessionKeys' && (
                        <motion.div
                            key="sessionKeys"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="flex justify-between items-center gap-4">
                                <h3 className="font-bold text-sm text-slate-300">Active Delegation Signers</h3>
                                <FeatureGate feature="sessionKeys">
                                    <Button
                                        size="sm"
                                        onClick={() => setIsCreateOpen(true)}
                                        className="gap-1 px-3.5 text-xs font-bold bg-primary hover:bg-primary-hover text-white"
                                        aria-label="Register new session key delegation policy"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Create Key
                                    </Button>
                                </FeatureGate>
                            </div>

                            {isLoading ? (
                                <Card className="p-12 border border-border/40 text-center bg-card/15 flex flex-col items-center justify-center gap-3">
                                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm font-semibold text-muted-foreground">Loading active session keys...</span>
                                </Card>
                            ) : sessionKeys.length === 0 ? (
                                <Card className="p-12 border border-border/40 text-center bg-card/15">
                                    <Key className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
                                    <h4 className="font-bold text-slate-200 text-sm">No Session Keys Configured</h4>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                                        Session keys allow you to authorize specific contracts or dApps to execute transactions within limits without signing each payload.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsCreateOpen(true)}
                                        className="mt-4 text-xs font-bold border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-900"
                                    >
                                        Create First Session Key
                                    </Button>
                                </Card>
                            ) : (
                                <Card className="p-0 overflow-hidden bg-slate-900/10 border border-slate-800">
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <THead>
                                                <TR className="bg-slate-950/40 border-b border-slate-800">
                                                    <TH className="py-3 px-4">Delegate Address / Key</TH>
                                                    <TH className="py-3 px-4">Permissions Scope</TH>
                                                    <TH className="py-3 px-4">Daily Allowance</TH>
                                                    <TH className="py-3 px-4">Status & Validity</TH>
                                                    <TH className="py-3 px-4 text-right">Actions</TH>
                                                </TR>
                                            </THead>
                                            <TBody>
                                                {sessionKeys.map((key) => {
                                                    const isExpired = key.expiryTime <= Math.floor(Date.now() / 1000);
                                                    const statusLabel = !key.isActive 
                                                        ? 'Revoked' 
                                                        : isExpired 
                                                            ? 'Expired' 
                                                            : 'Active';

                                                    return (
                                                        <TR key={key.key} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-900/10">
                                                            <TD className="py-3 px-4 font-mono text-xs text-slate-200">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="truncate max-w-[140px] block" title={key.key}>{key.key}</span>
                                                                    <button 
                                                                        onClick={() => handleCopy(key.key, 'Session key')}
                                                                        className="text-slate-500 hover:text-slate-300 transition-colors"
                                                                        title="Copy Key Address"
                                                                    >
                                                                        <Copy className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            </TD>
                                                            <TD className="py-3 px-4 text-xs text-slate-300">
                                                                {key.allowedTargets && key.allowedTargets.length > 0 ? (
                                                                    <span className="font-mono text-slate-400 text-[11px]">
                                                                        {key.allowedTargets.length} target contract(s)
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-red-400 italic">Unrestricted (No scopes)</span>
                                                                )}
                                                            </TD>
                                                            <TD className="py-3 px-4 text-xs font-mono font-bold text-slate-200">
                                                                {key.spendingLimit} ETH
                                                            </TD>
                                                            <TD className="py-3 px-4">
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                    statusLabel === 'Active' 
                                                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                                                        : statusLabel === 'Expired'
                                                                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                                            : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                                                                }`}>
                                                                    {statusLabel}
                                                                </span>
                                                            </TD>
                                                            <TD className="py-3 px-4 text-right flex items-center justify-end gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => setSelectedKey(key)}
                                                                    className="h-8 text-[11px] font-bold border-slate-800 text-slate-400 hover:text-white bg-slate-950/20"
                                                                >
                                                                    Inspect
                                                                </Button>
                                                                {key.isActive && !isExpired && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="danger"
                                                                        loading={isRevoking}
                                                                        onClick={() => handleRevoke(key.key)}
                                                                        className="h-8 text-[11px] font-bold"
                                                                    >
                                                                        Revoke
                                                                    </Button>
                                                                )}
                                                            </TD>
                                                        </TR>
                                                    );
                                                })}
                                            </TBody>
                                        </Table>
                                    </div>
                                </Card>
                            )}
                        </motion.div>
                    )}

                    {/* tab 3: CHRONOLOGICAL SECURITY EVENTS FEED */}
                    {activeTab === 'timeline' && (
                        <motion.div
                            key="timeline"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <h3 className="font-bold text-sm text-slate-300">Security Monitoring Logs</h3>
                            {securityEvents.length === 0 ? (
                                <Card className="p-8 text-center border border-border/40 bg-card/15">
                                    <FileText className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                                    <h4 className="font-bold text-slate-200 text-xs">No Security Events Logged</h4>
                                    <p className="text-[11px] text-muted-foreground mt-1 max-w-sm mx-auto">
                                        Realtime triggers (key expirations, on-chain confirmations, rejections) populate this security logs feed dynamically.
                                    </p>
                                </Card>
                            ) : (
                                <div className="space-y-4">
                                    {securityEvents.map((evt) => (
                                        <Card key={evt.id} className="p-4 bg-slate-900/30 border border-slate-800 flex items-start gap-4">
                                            <div className="mt-0.5 shrink-0">
                                                {evt.variant === 'success' ? (
                                                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                                ) : evt.variant === 'warning' ? (
                                                    <Clock className="w-5 h-5 text-amber-500" />
                                                ) : (
                                                    <ShieldAlert className="w-5 h-5 text-red-500" />
                                                )}
                                            </div>
                                            <div className="space-y-1 flex-1">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="font-bold text-slate-200">{evt.title}</span>
                                                    <span className="text-[10px] text-muted-foreground">{new Date(evt.timestamp).toLocaleString()}</span>
                                                </div>
                                                <p className="text-xs text-slate-400 leading-normal">{evt.description}</p>
                                                <div className="pt-1.5 flex items-center gap-2">
                                                    <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 font-mono text-[9px] uppercase rounded">
                                                        {evt.type}
                                                    </span>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* Creation Dialog Drawer */}
            <Dialog open={isCreateOpen} onOpenChange={(open) => !open && setIsCreateOpen(false)}>
                <DialogContent className="max-w-md bg-slate-950 border border-slate-800 p-6 rounded-xl shadow-2xl text-slate-100">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-base font-bold flex items-center gap-2">
                            <Key className="w-5 h-5 text-primary shrink-0" />
                            Register Ephemeral Session delegation
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-xs mt-1">
                            Configure parameters to delegate transaction signing boundaries to an external client credential.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateKey} className="space-y-4 text-xs font-semibold">
                        {/* Delegate address input with helper generate button */}
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <label className="text-slate-300 text-[11px]" htmlFor="session-key-addr">Session Signer Public Key / Address</label>
                                <button
                                    type="button"
                                    onClick={handleGenerateKeypair}
                                    className="text-[10px] text-primary hover:text-primary-hover font-bold flex items-center gap-1"
                                >
                                    <Cpu className="w-3 h-3" />
                                    Generate Signer Pair
                                </button>
                            </div>
                            <Input
                                id="session-key-addr"
                                type="text"
                                placeholder="0x..."
                                value={customKeyAddress}
                                onChange={(e) => setCustomKeyAddress(e.target.value)}
                                className="w-full h-9 font-mono font-medium text-xs bg-slate-900 border-slate-800 text-slate-100"
                                required
                            />
                            {generatedPrivate && (
                                <div className="p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-md text-amber-400 text-[10px] mt-1 space-y-1">
                                    <span className="font-bold uppercase tracking-wider block">Generated Signer Private Key (SAVE THIS NOW):</span>
                                    <div className="flex items-center justify-between gap-2 bg-slate-950 p-1.5 rounded border border-slate-900">
                                        <span className="font-mono select-all break-all">{generatedPrivate}</span>
                                        <button 
                                            type="button" 
                                            onClick={() => handleCopy(generatedPrivate, 'Generated Private Key')}
                                            className="text-slate-400 hover:text-white"
                                            title="Copy Private Key"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <span className="italic block text-[9px] text-slate-500 mt-1">This private key is required to sign transactions with this session key. It is never stored on the server!</span>
                                </div>
                            )}
                        </div>

                        {/* Name input */}
                        <div className="space-y-1">
                            <label className="text-slate-300 text-[11px]" htmlFor="session-key-name">Signer Name / Label</label>
                            <Input
                                id="session-key-name"
                                type="text"
                                placeholder="e.g. Defi Bot client"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                className="w-full h-9 bg-slate-900 border-slate-800 text-slate-100"
                            />
                        </div>

                        {/* Limit and Expiration Inputs */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-slate-300 text-[11px]" htmlFor="spending-limit-input">Daily Spending Limit (ETH)</label>
                                <Input
                                    id="spending-limit-input"
                                    type="number"
                                    step="0.001"
                                    placeholder="0.01"
                                    value={customSpendingLimit}
                                    onChange={(e) => setCustomSpendingLimit(e.target.value)}
                                    className="w-full h-9 bg-slate-900 border-slate-800 text-slate-100 font-mono"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-slate-300 text-[11px]" htmlFor="expiry-time-select">Delegation Expiration</label>
                                <Select
                                    options={[
                                        { value: '3600', label: '1 Hour' },
                                        { value: '86400', label: '1 Day' },
                                        { value: '604800', label: '7 Days' },
                                        { value: '2592000', label: '30 Days' }
                                    ]}
                                    value={customExpiry}
                                    onChange={setCustomExpiry}
                                    className="h-9"
                                />
                            </div>
                        </div>

                        {/* Allowed Targets input */}
                        <div className="space-y-1">
                            <label className="text-slate-300 text-[11px]" htmlFor="target-contract-address">Allowed Target Contract Address (Optional)</label>
                            <Input
                                id="target-contract-address"
                                type="text"
                                placeholder="0x... (Leave empty to authorize any contract)"
                                value={customTarget}
                                onChange={(e) => setCustomTarget(e.target.value)}
                                className="w-full h-9 font-mono bg-slate-900 border-slate-800 text-slate-100"
                            />
                        </div>

                        <div className="pt-4 border-t border-slate-800/80 flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateOpen(false)}
                                className="h-9 border-slate-800 text-slate-400 hover:bg-slate-900"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                loading={isCreating}
                                className="h-9 bg-primary hover:bg-primary-hover text-white px-4"
                            >
                                Register Policy
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Inspector Dialog Overlay */}
            <Dialog open={!!selectedKey} onOpenChange={(open) => !open && setSelectedKey(null)}>
                {selectedKey && (
                     <DialogContent className="max-w-md bg-slate-950 border border-slate-800 p-6 rounded-xl shadow-2xl text-slate-100">
                         <DialogHeader className="mb-4">
                             <DialogTitle className="text-base font-bold flex items-center gap-2">
                                 <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                                 Inspect Delegation Signer
                             </DialogTitle>
                             <DialogDescription className="text-slate-400 text-xs">
                                 Verification policies, spending limits, allowed contract targets, and raw metadata.
                             </DialogDescription>
                         </DialogHeader>

                         <div className="divide-y divide-slate-800/80 text-xs font-semibold bg-slate-900/20 px-3 rounded-lg border border-slate-800/50 mb-4">
                             <div className="py-2.5 flex justify-between">
                                 <span className="text-slate-400">Delegate Public Address</span>
                                 <div className="flex items-center gap-1">
                                     <span className="font-mono text-slate-100 truncate max-w-[200px]" title={selectedKey.key}>{selectedKey.key}</span>
                                     <button onClick={() => handleCopy(selectedKey.key, 'Signer Address')} className="text-slate-500 hover:text-white">
                                         <Copy className="w-3.5 h-3.5" />
                                     </button>
                                 </div>
                             </div>
                             <div className="py-2.5 flex justify-between">
                                 <span className="text-slate-400">Daily Spending Allowance</span>
                                 <span className="font-mono text-slate-100 font-bold">{selectedKey.spendingLimit} ETH</span>
                             </div>
                             <div className="py-2.5 flex justify-between">
                                 <span className="text-slate-400">Allowed Contract Target</span>
                                 <span className="font-mono text-slate-200">
                                     {selectedKey.allowedTargets && selectedKey.allowedTargets.length > 0 
                                         ? selectedKey.allowedTargets[0]
                                         : 'Any contract (Wildcard)'}
                                 </span>
                             </div>
                             <div className="py-2.5 flex justify-between">
                                 <span className="text-slate-400">Expiration Timeframe</span>
                                 <span className="text-slate-100 flex items-center gap-1.5">
                                     <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                                     {new Date(selectedKey.expiryTime * 1000).toLocaleString()}
                                 </span>
                             </div>
                             <div className="py-2.5 flex justify-between">
                                 <span className="text-slate-400">Execution Status</span>
                                 <span className="text-slate-100">
                                     {selectedKey.isActive ? 'Active & Validated' : 'Revoked'}
                                 </span>
                             </div>
                             {selectedKey.createdAt && (
                                 <div className="py-2.5 flex justify-between">
                                     <span className="text-slate-400">Registration Timestamp</span>
                                     <span className="text-slate-100">{new Date(selectedKey.createdAt).toLocaleString()}</span>
                                 </div>
                             )}
                         </div>

                         {/* Raw JSON toggle */}
                         <div className="border-t border-slate-800 pt-4">
                             <button
                                 onClick={() => setShowRawMetadata(!showRawMetadata)}
                                 className="text-xs text-primary hover:text-primary-hover font-bold flex items-center gap-1.5 transition-colors"
                             >
                                 <span>{showRawMetadata ? 'Hide Raw Metadata JSON' : 'Show Raw Metadata JSON'}</span>
                             </button>

                             {showRawMetadata && (
                                 <pre className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 font-mono text-[10px] text-emerald-400/90 mt-2 overflow-x-auto max-h-40">
                                     {JSON.stringify(selectedKey, null, 2)}
                                 </pre>
                             )}
                         </div>

                         <div className="mt-6 flex justify-end">
                             <Button 
                                 variant="outline" 
                                 size="sm" 
                                 onClick={() => setSelectedKey(null)}
                                 className="border-slate-800 text-slate-300 hover:bg-slate-900"
                             >
                                 Close Inspector
                             </Button>
                         </div>
                     </DialogContent>
                )}
            </Dialog>
        </>
    );
};
