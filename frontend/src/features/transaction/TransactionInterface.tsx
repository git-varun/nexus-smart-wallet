import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { isAddress, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/ui/Dialog';
import { BundlerSelector } from '@/features/wallet/BundlerSelector';
import { PaymasterSelector } from '@/features/wallet/PaymasterSelector';
import { ChainSelector } from '@/features/wallet/ChainSelector';
import { FeatureGate } from '@/entities/capability/ui/FeatureGate';
import { useCapabilityContext } from '@/entities/capability/model/CapabilityContext';
import { useBackendSmartAccount } from '@/entities/wallet/hooks/useBackendSmartAccount';
import { useTransactionHistoryBackend } from '@/entities/transaction/hooks/useTransactionHistoryBackend';
import { usePortfolio } from '@/entities/portfolio/hooks/usePortfolio';
import { useSessionKeys } from '@/entities/sessionKey/hooks/useSessionKeys';
import { setSmartAccountInfo } from '@/app/store/smartAccountSlice';
import { DEFAULT_BUNDLER } from '@/app/config/bundlers';
import { DEFAULT_PAYMASTER } from '@/app/config/paymasters';
import { getChainById } from '@/app/config/chains';
import { TransactionLifecycleTimeline } from '@/shared/ui/ProgressTimeline';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/shared/hooks/useToast';
import { decryptPrivateKey } from '@/shared/lib/crypto';
import { 
    ArrowRight, Plus, Trash2, Settings, 
    Activity, CheckCircle2, XCircle, Info, ExternalLink, 
    Copy, Check, ChevronUp, ChevronDown 
} from 'lucide-react';

type TabType = 'simple' | 'advanced' | 'batch';

interface BatchCall {
    to: string;
    selectedToken: string; // 'native' or ERC20 contract address
    symbol: string;
    decimals: number;
    amount: string;
    data: string;
}

export const TransactionInterface: React.FC = () => {
    const dispatch = useDispatch();
    const { toast } = useToast();
    const { hasCapability } = useCapabilityContext();

    // Redux & Smart account hooks
    const { 
        token, 
        accountInfo, 
        userAccounts, 
        currentChainId, 
        switchChain, 
        deploySmartAccount 
    } = useBackendSmartAccount();

    const { 
        sendTransaction, 
        transactions 
    } = useTransactionHistoryBackend();

    const { assets } = usePortfolio();
    const { sessionKeys } = useSessionKeys();

    // Tabs
    const [activeTab, setActiveTab] = useState<TabType>('simple');
    const [showProviderSettings, setShowProviderSettings] = useState(false);

    // Providers
    const [selectedBundler, setSelectedBundler] = useState<string>(DEFAULT_BUNDLER);
    const [selectedPaymaster, setSelectedPaymaster] = useState<string>(DEFAULT_PAYMASTER);
    const [selectedSessionKey, setSelectedSessionKey] = useState<string>('none');
    const [inputSessionPrivateKey, setInputSessionPrivateKey] = useState('');
    const [showPrivateKeyPrompt, setShowPrivateKeyPrompt] = useState(false);

    // Simple Tab State
    const [selectedTokenAddress, setSelectedTokenAddress] = useState<string>('native');
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [memo, setMemo] = useState('');

    // Advanced Tab State
    const [toAddress, setToAddress] = useState('');
    const [value, setValue] = useState('');
    const [data, setData] = useState('0x');

    // Batch Tab State
    const [batchCalls, setBatchCalls] = useState<BatchCall[]>([
        { to: '', selectedToken: 'native', symbol: 'ETH', decimals: 18, amount: '', data: '0x' }
    ]);

    // Validation & Loading
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [isEstimating, setIsEstimating] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [gasEstimateResult, setGasEstimateResult] = useState<string | null>(null);

    // Modal Status Controls
    const [previewOpen, setPreviewOpen] = useState(false);
    const [lifecycleOpen, setLifecycleOpen] = useState(false);
    const [activeTxId, setActiveTxId] = useState<string | null>(null);
    const [copiedText, setCopiedText] = useState(false);

    // Deploy smart account loader
    const [isDeployingAccount, setIsDeployingAccount] = useState(false);

    // Available tokens mapped from usePortfolio
    const tokenOptions = useMemo(() => {
        const options = [{ value: 'native', label: 'ETH (Native)' }];
        assets.forEach(asset => {
            if (asset.type === 'erc20') {
                options.push({
                    value: asset.tokenAddress,
                    label: `${asset.symbol} - ${asset.name}`
                });
            }
        });
        return options;
    }, [assets]);

    // Available Smart Accounts options
    const smartAccountOptions = useMemo(() => {
        return userAccounts.map(acc => ({
            value: acc.address,
            label: `${acc.address.slice(0, 6)}...${acc.address.slice(-4)} (${acc.walletID})`,
            description: `Balance: ${parseFloat(acc.balance || '0') > 0 ? (Number(acc.balance || '0') / 1e18).toFixed(4) : '0'} ETH`
        }));
    }, [userAccounts]);

    // Available Session Keys options
    const sessionKeyOptions = useMemo(() => {
        const options = [{ value: 'none', label: 'Owner Key (No Session Key)' }];
        sessionKeys.forEach(sk => {
            if (sk.isActive) {
                options.push({
                    value: sk.key,
                    label: `Session: ${sk.key.slice(0, 6)}...${sk.key.slice(-4)}`
                });
            }
        });
        return options;
    }, [sessionKeys]);

    const activeChain = getChainById(currentChainId);

    // Active session key details helper
    const activeSessionKeyDetails = useMemo(() => {
        if (selectedSessionKey === 'none') return null;
        return sessionKeys.find(sk => sk.key === selectedSessionKey) || null;
    }, [selectedSessionKey, sessionKeys]);

    // Active Selected Token
    const selectedTokenAsset = useMemo(() => {
        if (selectedTokenAddress === 'native') {
            return assets.find(a => a.type === 'native') || {
                symbol: 'ETH',
                decimals: 18,
                balance: accountInfo?.balance || '0',
                priceUsd: 3200
            };
        }
        return assets.find(a => a.tokenAddress.toLowerCase() === selectedTokenAddress.toLowerCase()) || null;
    }, [selectedTokenAddress, assets, accountInfo]);

    // Max balances
    const handleSetMax = () => {
        if (!selectedTokenAsset) return;
        try {
            const raw = BigInt(selectedTokenAsset.balance);
            const formatted = Number(raw) / Math.pow(10, selectedTokenAsset.decimals);
            setAmount(formatted.toString());
        } catch {
            setAmount('0');
        }
    };

    // Recipient address verification
    const isValidEthereumAddress = (addr: string): boolean => {
        return isAddress(addr);
    };

    // ERC20 Data Encoder
    const encodeERC20Transfer = (to: string, amountBigInt: bigint): string => {
        const cleanAddress = to.replace(/^0x/, '').toLowerCase().padStart(64, '0');
        const cleanAmount = amountBigInt.toString(16).padStart(64, '0');
        return `0xa9059cbb${cleanAddress}${cleanAmount}`;
    };

    const parseUnits = (val: string, dec: number): bigint => {
        try {
            const parts = val.split('.');
            const integerPart = parts[0] || '0';
            let fractionalPart = parts[1] || '';
            fractionalPart = fractionalPart.slice(0, dec).padEnd(dec, '0');
            return BigInt(integerPart + fractionalPart);
        } catch {
            return BigInt(0);
        }
    };

    // Validate inputs
    const getErrors = (): Record<string, string> => {
        const errors: Record<string, string> = {};

        if (activeTab === 'simple') {
            if (!recipient) {
                errors.recipient = 'Recipient address is required';
            } else if (!isValidEthereumAddress(recipient)) {
                errors.recipient = 'Invalid Ethereum address';
            }

            if (!amount) {
                errors.amount = 'Amount is required';
            } else if (isNaN(Number(amount)) || Number(amount) <= 0) {
                errors.amount = 'Amount must be positive';
            } else if (selectedTokenAsset) {
                const rawBalance = BigInt(selectedTokenAsset.balance);
                const inputBigInt = parseUnits(amount, selectedTokenAsset.decimals);
                if (inputBigInt > rawBalance) {
                    errors.amount = 'Insufficient balance';
                }
            }
        } else if (activeTab === 'advanced') {
            if (!toAddress) {
                errors.toAddress = 'Target address is required';
            } else if (!isValidEthereumAddress(toAddress)) {
                errors.toAddress = 'Invalid Ethereum address';
            }

            if (value && (isNaN(Number(value)) || Number(value) < 0)) {
                errors.value = 'Value must be positive';
            }

            if (!data.startsWith('0x')) {
                errors.data = 'Data must be valid hexadecimal starting with 0x';
            }
        } else if (activeTab === 'batch') {
            batchCalls.forEach((call, index) => {
                if (!call.to) {
                    errors[`to_${index}`] = 'Recipient is required';
                } else if (!isValidEthereumAddress(call.to)) {
                    errors[`to_${index}`] = 'Invalid Ethereum address';
                }
                if (!call.amount) {
                    errors[`amount_${index}`] = 'Amount is required';
                } else if (isNaN(Number(call.amount)) || Number(call.amount) <= 0) {
                    errors[`amount_${index}`] = 'Amount must be positive';
                }
            });
        }

        return errors;
    };

    const validateForm = () => {
        const errors = getErrors();
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const isFormValid = Object.keys(getErrors()).length === 0;

    // Estimate Gas Costs
    const handleEstimateGas = async () => {
        if (!validateForm() || !token) return;
        setIsEstimating(true);
        setGasEstimateResult(null);

        try {
            if (activeTab === 'simple') {
                const txTo = selectedTokenAddress === 'native' ? recipient : selectedTokenAddress;
                const txValue = selectedTokenAddress === 'native' ? parseEther(amount) : BigInt(0);
                const txData = selectedTokenAddress === 'native' 
                    ? '0x' 
                    : encodeERC20Transfer(recipient, parseUnits(amount, selectedTokenAsset?.decimals || 18));

                const res = await apiClient.estimateGas(
                    token,
                    currentChainId,
                    selectedBundler,
                    selectedPaymaster,
                    accountInfo?.walletID || 'ALCHEMY',
                    txTo as `0x${string}`,
                    txData,
                    txValue
                );

                if (res.success && res.data) {
                    setGasEstimateResult(res.data.gasEstimate);
                } else {
                    throw new Error(res.error?.message || 'Estimation rejected by backend');
                }
            } else if (activeTab === 'advanced') {
                const res = await apiClient.estimateGas(
                    token,
                    currentChainId,
                    selectedBundler,
                    selectedPaymaster,
                    accountInfo?.walletID || 'ALCHEMY',
                    toAddress as `0x${string}`,
                    data,
                    value ? parseEther(value) : BigInt(0)
                );

                if (res.success && res.data) {
                    setGasEstimateResult(res.data.gasEstimate);
                } else {
                    throw new Error(res.error?.message || 'Estimation rejected by backend');
                }
            } else if (activeTab === 'batch') {
                // Batch estimation by running individual estimations and summing
                let sumGas = BigInt(0);
                for (const call of batchCalls) {
                    const callTo = call.selectedToken === 'native' ? call.to : call.selectedToken;
                    const callValue = call.selectedToken === 'native' ? parseEther(call.amount) : BigInt(0);
                    const callData = call.selectedToken === 'native'
                        ? '0x'
                        : encodeERC20Transfer(call.to, parseUnits(call.amount, call.decimals));

                    const res = await apiClient.estimateGas(
                        token,
                        currentChainId,
                        selectedBundler,
                        selectedPaymaster,
                        accountInfo?.walletID || 'ALCHEMY',
                        callTo as `0x${string}`,
                        callData,
                        callValue
                    );

                    if (res.success && res.data) {
                        sumGas += BigInt(res.data.gasEstimate);
                    } else {
                        throw new Error(res.error?.message || 'Failed estimating call in batch');
                    }
                }
                setGasEstimateResult(sumGas.toString());
            }
        } catch (err: any) {
            toast({
                title: 'Gas Estimation Failed',
                description: err.message || 'Could not estimate transaction gas.',
                variant: 'error'
            });
        } finally {
            setIsEstimating(false);
        }
    };

    // Confirm transaction execution (triggers modal preview)
    const handleOpenPreview = () => {
        if (!validateForm()) return;
        handleEstimateGas();
        setPreviewOpen(true);
    };

    // Smart Account counterfactual deploy
    const handleDeploySmartAccount = async () => {
        if (!token) return;
        setIsDeployingAccount(true);
        try {
            await deploySmartAccount(selectedPaymaster, selectedBundler);
            toast({
                title: 'Smart Account Deployed',
                description: 'Your counterfactual smart account has been successfully initialized on-chain.',
                variant: 'success'
            });
        } catch (err: any) {
            toast({
                title: 'Deployment Failed',
                description: err.message || 'Smart account initialization encountered an error.',
                variant: 'error'
            });
        } finally {
            setIsDeployingAccount(false);
        }
    };

    // Send Transaction Submission
    const handleExecuteTransaction = async () => {
        if (!token || !accountInfo) return;

        let privateKeyToUse = '';
        if (selectedSessionKey !== 'none') {
            const storedEncrypted = localStorage.getItem(`nexus-session-pk-${selectedSessionKey.toLowerCase()}`);
            privateKeyToUse = (storedEncrypted ? decryptPrivateKey(storedEncrypted) : null) || inputSessionPrivateKey;
            if (!privateKeyToUse) {
                setPreviewOpen(false);
                setShowPrivateKeyPrompt(true);
                toast({
                    title: 'Private Key Required',
                    description: 'Please provide the session private key to authorize this transaction.',
                    variant: 'warning'
                });
                return;
            }
        }

        setPreviewOpen(false);
        setLifecycleOpen(true);
        setIsExecuting(true);
        setActiveTxId(null);

        try {
            if (activeTab === 'simple') {
                const txTo = selectedTokenAddress === 'native' ? recipient : selectedTokenAddress;
                const txValue = selectedTokenAddress === 'native' ? parseEther(amount) : BigInt(0);
                const txData = selectedTokenAddress === 'native' 
                    ? '0x' 
                    : encodeERC20Transfer(recipient, parseUnits(amount, selectedTokenAsset?.decimals || 18));
                
                const valueStr = selectedTokenAddress === 'native' ? amount : '0';

                let sessionKeySignature: string | undefined = undefined;
                if (selectedSessionKey !== 'none' && privateKeyToUse) {
                    const sessionAccount = privateKeyToAccount(privateKeyToUse as `0x${string}`);
                    const message = `Execute transaction:\nTo: ${txTo.toLowerCase()}\nValue: ${valueStr}\nData: ${txData.toLowerCase()}\nChain ID: ${currentChainId}\nSession Key: ${selectedSessionKey.toLowerCase()}`;
                    sessionKeySignature = await sessionAccount.signMessage({ message });
                }

                const providers = {
                    bundlerID: selectedBundler.toUpperCase(),
                    paymasterID: selectedPaymaster.toUpperCase(),
                    walletID: accountInfo.walletID,
                    chainId: currentChainId,
                    sessionKeyAddress: selectedSessionKey !== 'none' ? selectedSessionKey : undefined,
                    sessionKeySignature
                };

                const result = await sendTransaction(
                    token,
                    txTo as `0x${string}`,
                    txData,
                    txValue,
                    providers
                );

                if (result) {
                    setActiveTxId(result.id);
                }
            } else if (activeTab === 'advanced') {
                const txTo = toAddress;
                const txValue = value ? parseEther(value) : BigInt(0);
                const txData = data;
                const valueStr = value || '0';

                let sessionKeySignature: string | undefined = undefined;
                if (selectedSessionKey !== 'none' && privateKeyToUse) {
                    const sessionAccount = privateKeyToAccount(privateKeyToUse as `0x${string}`);
                    const message = `Execute transaction:\nTo: ${txTo.toLowerCase()}\nValue: ${valueStr}\nData: ${txData.toLowerCase()}\nChain ID: ${currentChainId}\nSession Key: ${selectedSessionKey.toLowerCase()}`;
                    sessionKeySignature = await sessionAccount.signMessage({ message });
                }

                const providers = {
                    bundlerID: selectedBundler.toUpperCase(),
                    paymasterID: selectedPaymaster.toUpperCase(),
                    walletID: accountInfo.walletID,
                    chainId: currentChainId,
                    sessionKeyAddress: selectedSessionKey !== 'none' ? selectedSessionKey : undefined,
                    sessionKeySignature
                };

                const result = await sendTransaction(
                    token,
                    txTo as `0x${string}`,
                    txData,
                    txValue,
                    providers
                );

                if (result) {
                    setActiveTxId(result.id);
                }
            } else if (activeTab === 'batch') {
                const callsPayload = batchCalls.map(call => {
                    const to = call.selectedToken === 'native' ? call.to : call.selectedToken;
                    const value = call.selectedToken === 'native' ? call.amount : '0';
                    const data = call.selectedToken === 'native' 
                        ? '0x' 
                        : encodeERC20Transfer(call.to, parseUnits(call.amount, call.decimals));
                    return { to, value, data };
                });

                let sessionKeySignature: string | undefined = undefined;
                if (selectedSessionKey !== 'none' && privateKeyToUse) {
                    const sessionAccount = privateKeyToAccount(privateKeyToUse as `0x${string}`);
                    const callsStr = callsPayload.map(c => `${c.to.toLowerCase()}:${c.value || '0'}:${c.data || '0x'}`).join(',');
                    const message = `Execute batch transaction:\nCalls: ${callsStr}\nChain ID: ${currentChainId}\nSession Key: ${selectedSessionKey.toLowerCase()}`;
                    sessionKeySignature = await sessionAccount.signMessage({ message });
                }

                const response = await apiClient.sendTransactionBatch(token, {
                    calls: callsPayload,
                    chainId: currentChainId,
                    walletID: accountInfo.walletID,
                    paymasterID: selectedPaymaster.toUpperCase(),
                    bundlerID: selectedBundler.toUpperCase(),
                    sessionKeyAddress: selectedSessionKey !== 'none' ? selectedSessionKey : undefined,
                    sessionKeySignature
                });

                if (response.success && response.data?.transaction) {
                    toast({
                        title: 'Batch Dispatched',
                        description: 'Batch transactions queue submitted successfully',
                        variant: 'success'
                    });
                    setActiveTxId(response.data.transaction.hash || response.data.transaction.id);
                } else {
                    throw new Error(response.error?.message || 'Batch dispatch rejected by backend');
                }
            }
        } catch (err: any) {
            toast({
                title: 'Execution Failed',
                description: err.message || 'Transaction submission failed.',
                variant: 'error'
            });
            setLifecycleOpen(false);
        } finally {
            setIsExecuting(false);
        }
    };

    // Trace active transaction from hook query history (for reactive timeline)
    const activeTx = useMemo(() => {
        if (!activeTxId) return null;
        return transactions.find(t => 
            t.id === activeTxId || 
            t.hash === activeTxId || 
            t.userOpHash === activeTxId
        ) || null;
    }, [activeTxId, transactions]);

    // Sum Batch amounts
    const batchSummary = useMemo(() => {
        let totalValueEth = 0;
        const tokensCount: Record<string, number> = {};

        batchCalls.forEach(call => {
            if (call.selectedToken === 'native') {
                totalValueEth += parseFloat(call.amount) || 0;
            }
            const sym = call.symbol;
            tokensCount[sym] = (tokensCount[sym] || 0) + (parseFloat(call.amount) || 0);
        });

        return {
            totalValueEth,
            tokensCount
        };
    }, [batchCalls]);

    // Add Call to Batch
    const handleAddCall = () => {
        setBatchCalls(prev => [
            ...prev,
            { to: '', selectedToken: 'native', symbol: 'ETH', decimals: 18, amount: '', data: '0x' }
        ]);
    };

    // Remove Call from Batch
    const handleRemoveCall = (idx: number) => {
        if (batchCalls.length === 1) return;
        setBatchCalls(prev => prev.filter((_, i) => i !== idx));
    };

    // Reorder calls
    const handleMoveCall = (index: number, direction: 'up' | 'down') => {
        const nextIndex = direction === 'up' ? index - 1 : index + 1;
        if (nextIndex < 0 || nextIndex >= batchCalls.length) return;
        const updated = [...batchCalls];
        const temp = updated[index];
        updated[index] = updated[nextIndex];
        updated[nextIndex] = temp;
        setBatchCalls(updated);
    };

    // Handle token selector in batch call
    const handleBatchTokenSelect = (idx: number, val: string) => {
        const tokenAsset = val === 'native' 
            ? { symbol: 'ETH', decimals: 18 } 
            : assets.find(a => a.tokenAddress.toLowerCase() === val.toLowerCase());

        setBatchCalls(prev => prev.map((call, i) => {
            if (i === idx) {
                return {
                    ...call,
                    selectedToken: val,
                    symbol: tokenAsset?.symbol || 'ETH',
                    decimals: tokenAsset?.decimals || 18
                };
            }
            return call;
        }));
    };

    // Handle input field changes in batch call
    const handleBatchFieldChange = (idx: number, field: 'to' | 'amount' | 'data', val: string) => {
        setBatchCalls(prev => prev.map((call, i) => {
            if (i === idx) {
                return {
                    ...call,
                    [field]: val
                };
            }
            return call;
        }));
    };

    // Copy to clipboard
    const handleCopy = (txt: string) => {
        navigator.clipboard.writeText(txt);
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2000);
    };

    return (
        <div className="space-y-6">
            {/* Top Toolbar: Chain selection, Smart Account Selection, Settings toggles */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
                <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2">Smart Account</label>
                    <Select
                        options={smartAccountOptions}
                        value={accountInfo?.address || ''}
                        onChange={(addr) => {
                            const found = userAccounts.find(a => a.address === addr);
                            if (found) dispatch(setSmartAccountInfo(found));
                        }}
                    />
                </div>
                <div>
                    <ChainSelector
                        selectedChainId={currentChainId}
                        onChainSelect={(id) => switchChain(id)}
                    />
                </div>
                <div className="flex justify-end">
                    <Button
                        variant="outline"
                        onClick={() => setShowProviderSettings(!showProviderSettings)}
                        className="w-full lg:w-auto flex items-center justify-center gap-2 h-10 px-4"
                    >
                        <Settings className="w-4 h-4" />
                        {showProviderSettings ? 'Hide Provider Config' : 'Provider Settings'}
                    </Button>
                </div>
            </div>

            {/* Provider settings drawer */}
            <AnimatePresence>
                {showProviderSettings && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <Card className="p-6 bg-slate-950/40 border border-slate-800">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <BundlerSelector
                                    selectedBundler={selectedBundler}
                                    onBundlerSelect={setSelectedBundler}
                                    selectedChainId={currentChainId}
                                />
                                <PaymasterSelector
                                    selectedPaymaster={selectedPaymaster}
                                    onPaymasterSelect={setSelectedPaymaster}
                                    selectedChainId={currentChainId}
                                />
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Counterfactual account deployment check */}
            {accountInfo && !accountInfo.isDeployed && (
                <Card className="p-5 border-l-4 border-l-orange-500 bg-orange-950/10 border border-orange-500/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex gap-3">
                            <Info className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-orange-400 text-sm">Counterfactual Wallet Address</h4>
                                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                                    Your smart wallet account is configured but not yet registered on-chain. 
                                    It will deploy automatically with your first transaction, or you can deploy it now.
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="primary"
                            size="sm"
                            loading={isDeployingAccount}
                            onClick={handleDeploySmartAccount}
                            className="bg-orange-500 hover:bg-orange-600 shrink-0 text-xs font-bold"
                        >
                            Deploy Account
                        </Button>
                    </div>
                </Card>
            )}

            {/* Transaction Form Card */}
            <Card className="p-6 bg-card/40 border border-border/80 relative">
                {/* Form Tabs */}
                <div className="flex items-center gap-1.5 border-b border-border/60 pb-4 mb-6">
                    <button
                        onClick={() => { setActiveTab('simple'); setValidationErrors({}); }}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                            activeTab === 'simple' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/10'
                        }`}
                    >
                        Single Transfer
                    </button>
                    <button
                        onClick={() => { setActiveTab('advanced'); setValidationErrors({}); }}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                            activeTab === 'advanced' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/10'
                        }`}
                    >
                        Advanced Data
                    </button>
                    {hasCapability('batching') && (
                        <button
                            onClick={() => { setActiveTab('batch'); setValidationErrors({}); }}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                                activeTab === 'batch' 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/10'
                            }`}
                        >
                            Batch Execute
                        </button>
                    )}
                </div>

                {/* Simple Transfer View */}
                {activeTab === 'simple' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1">
                                <label className="block text-sm font-semibold text-muted-foreground mb-2">Token</label>
                                <Select
                                    options={tokenOptions}
                                    value={selectedTokenAddress}
                                    onChange={setSelectedTokenAddress}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-muted-foreground mb-2">Recipient Address</label>
                                <Input
                                    placeholder="0x..."
                                    value={recipient}
                                    onChange={e => {
                                        setRecipient(e.target.value);
                                        if (validationErrors.recipient) setValidationErrors(prev => ({ ...prev, recipient: '' }));
                                    }}
                                    error={validationErrors.recipient}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-semibold text-muted-foreground">Amount</label>
                                    {selectedTokenAsset && (
                                        <button 
                                            onClick={handleSetMax}
                                            className="text-xs text-primary font-bold hover:underline"
                                        >
                                            Max: {parseFloat(selectedTokenAsset.balance) > 0 ? (Number(selectedTokenAsset.balance) / Math.pow(10, selectedTokenAsset.decimals)).toFixed(4) : '0'} {selectedTokenAsset.symbol}
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <Input
                                        placeholder="0.0"
                                        value={amount}
                                        onChange={e => {
                                            setAmount(e.target.value);
                                            if (validationErrors.amount) setValidationErrors(prev => ({ ...prev, amount: '' }));
                                        }}
                                        error={validationErrors.amount}
                                        className="pr-16"
                                    />
                                    <span className="absolute right-3 top-2 text-sm font-semibold text-muted-foreground">
                                        {selectedTokenAsset?.symbol || 'ETH'}
                                    </span>
                                </div>
                                {amount && selectedTokenAsset?.priceUsd && (
                                    <p className="text-xs text-muted-foreground font-semibold font-mono mt-1.5">
                                        ≈ ${(parseFloat(amount) * selectedTokenAsset.priceUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-muted-foreground mb-2">Memo / Reference (Optional)</label>
                                <Input
                                    placeholder="Reference label"
                                    value={memo}
                                    onChange={e => setMemo(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Advanced View */}
                {activeTab === 'advanced' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-muted-foreground mb-2">Contract Address</label>
                                <Input
                                    placeholder="0x..."
                                    value={toAddress}
                                    onChange={e => {
                                        setToAddress(e.target.value);
                                        if (validationErrors.toAddress) setValidationErrors(prev => ({ ...prev, toAddress: '' }));
                                    }}
                                    error={validationErrors.toAddress}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-muted-foreground mb-2">Value (ETH, optional)</label>
                                <Input
                                    placeholder="0.0"
                                    value={value}
                                    onChange={e => setValue(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-muted-foreground mb-2">Call Data (Hexadecimal)</label>
                            <Input
                                placeholder="0x..."
                                value={data}
                                onChange={e => {
                                    setData(e.target.value);
                                    if (validationErrors.data) setValidationErrors(prev => ({ ...prev, data: '' }));
                                }}
                                error={validationErrors.data}
                            />
                        </div>
                    </div>
                )}

                {/* Batch Transfer View */}
                {activeTab === 'batch' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-foreground text-sm uppercase tracking-wider text-muted-foreground">
                                Batch Queue
                            </h4>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleAddCall}
                                className="text-xs font-bold gap-1 h-8"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add Transaction
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {batchCalls.map((call, idx) => (
                                <div 
                                    key={idx} 
                                    className="p-4 bg-slate-900/50 border border-border/60 rounded-xl grid grid-cols-1 lg:grid-cols-12 gap-4 items-end relative"
                                >
                                    <div className="lg:col-span-2">
                                        <label className="block text-xs font-bold text-muted-foreground mb-1.5">Asset</label>
                                        <Select
                                            options={tokenOptions}
                                            value={call.selectedToken}
                                            onChange={(val) => handleBatchTokenSelect(idx, val)}
                                        />
                                    </div>
                                    <div className="lg:col-span-5">
                                        <label className="block text-xs font-bold text-muted-foreground mb-1.5">Recipient</label>
                                        <Input
                                            placeholder="0x..."
                                            value={call.to}
                                            onChange={e => handleBatchFieldChange(idx, 'to', e.target.value)}
                                            error={validationErrors[`to_${idx}`]}
                                            className="h-10 text-xs"
                                        />
                                    </div>
                                    <div className="lg:col-span-3">
                                        <label className="block text-xs font-bold text-muted-foreground mb-1.5">Amount ({call.symbol})</label>
                                        <Input
                                            placeholder="0.0"
                                            value={call.amount}
                                            onChange={e => handleBatchFieldChange(idx, 'amount', e.target.value)}
                                            error={validationErrors[`amount_${idx}`]}
                                            className="h-10 text-xs"
                                        />
                                    </div>
                                    <div className="lg:col-span-2 flex justify-end gap-2 items-center">
                                        {/* Reordering */}
                                        <div className="flex flex-col gap-1">
                                            <button 
                                                onClick={() => handleMoveCall(idx, 'up')}
                                                disabled={idx === 0}
                                                className="p-1 hover:bg-slate-800 rounded disabled:opacity-30"
                                                title="Move up"
                                            >
                                                <ChevronUp className="w-3.5 h-3.5" />
                                            </button>
                                            <button 
                                                onClick={() => handleMoveCall(idx, 'down')}
                                                disabled={idx === batchCalls.length - 1}
                                                className="p-1 hover:bg-slate-800 rounded disabled:opacity-30"
                                                title="Move down"
                                            >
                                                <ChevronDown className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleRemoveCall(idx)}
                                            disabled={batchCalls.length === 1}
                                            className="h-10 px-2.5 text-red-500 hover:bg-red-500/10"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Batch summary cards */}
                        <div className="p-4 bg-slate-900/30 border border-border/40 rounded-xl text-xs font-semibold grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-muted-foreground block">Calls Count</span>
                                <span className="text-sm font-bold text-foreground">{batchCalls.length} calls queued</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Transferred Assets</span>
                                <div className="space-y-1 mt-1 text-sm font-bold text-foreground">
                                    {Object.entries(batchSummary.tokensCount).map(([sym, qty]) => (
                                        <div key={sym}>{qty.toFixed(4)} {sym}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Session Keys selector (Capability Gate) */}
                <FeatureGate feature="sessionKeys">
                    <div className="mt-6 pt-6 border-t border-border/60 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-muted-foreground mb-2">
                                Signature Session Authorization
                            </label>
                            <Select
                                options={sessionKeyOptions}
                                value={selectedSessionKey}
                                onChange={setSelectedSessionKey}
                            />
                        </div>

                        {/* Session limits inspection card */}
                        {activeSessionKeyDetails && (
                            <Card className="p-4 bg-primary/5 border border-primary/20 flex flex-col justify-between text-xs font-semibold">
                                <div className="space-y-2">
                                    <span className="text-primary uppercase tracking-wider block font-bold">
                                        Session Key Privileges
                                    </span>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Spending Limit:</span>
                                        <span className="font-mono text-foreground">
                                            {formatEther(BigInt(activeSessionKeyDetails.spendingLimit))} ETH
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Remaining Daily Allow:</span>
                                        <span className="font-mono text-foreground">
                                            {formatEther(BigInt(activeSessionKeyDetails.dailyLimit))} ETH
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Expiration Time:</span>
                                        <span className="text-foreground">
                                            {new Date(activeSessionKeyDetails.expiryTime * 1000).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                </FeatureGate>

                {/* Action button */}
                <div className="mt-8 flex justify-end">
                    <Button
                        variant="primary"
                        onClick={handleOpenPreview}
                        disabled={!isFormValid}
                        className="w-full md:w-auto h-11 px-8 font-bold text-sm shadow-lg gap-2"
                    >
                        Preview Transaction
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            </Card>

            {/* PREVIEW MODAL */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-md bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-xl text-slate-100">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-lg font-bold">Transaction Preview</DialogTitle>
                        <DialogDescription className="text-slate-400 text-xs">
                            Verify full transaction details, payload inputs, and sponsor fees.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 text-xs font-semibold divide-y divide-slate-800">
                        <div className="py-2.5 flex justify-between">
                            <span className="text-slate-400">Sender Smart Wallet</span>
                            <span className="font-mono text-slate-100 truncate max-w-[200px]" title={accountInfo?.address}>
                                {accountInfo?.address}
                            </span>
                        </div>
                        {activeTab === 'simple' && (
                            <>
                                <div className="py-2.5 flex justify-between">
                                    <span className="text-slate-400">Recipient</span>
                                    <span className="font-mono text-slate-100 truncate max-w-[200px]" title={recipient}>
                                        {recipient}
                                    </span>
                                </div>
                                <div className="py-2.5 flex justify-between">
                                    <span className="text-slate-400">Asset & Amount</span>
                                    <span className="font-bold text-slate-100">
                                        {amount} {selectedTokenAsset?.symbol || 'ETH'}
                                    </span>
                                </div>
                            </>
                        )}
                        {activeTab === 'advanced' && (
                            <>
                                <div className="py-2.5 flex justify-between">
                                    <span className="text-slate-400">Contract Target</span>
                                    <span className="font-mono text-slate-100 truncate max-w-[200px]" title={toAddress}>
                                        {toAddress}
                                    </span>
                                </div>
                                <div className="py-2.5 flex justify-between">
                                    <span className="text-slate-400">ETH Value</span>
                                    <span className="font-mono text-slate-100">{value || '0'} ETH</span>
                                </div>
                            </>
                        )}
                        {activeTab === 'batch' && (
                            <>
                                <div className="py-2.5 flex justify-between">
                                    <span className="text-slate-400">Mode</span>
                                    <span className="font-bold text-slate-100">Batch Call</span>
                                </div>
                                <div className="py-2.5 flex justify-between">
                                    <span className="text-slate-400">Batch Calls count</span>
                                    <span className="font-bold text-slate-100">{batchCalls.length} calls</span>
                                </div>
                            </>
                        )}
                        <div className="py-2.5 flex justify-between">
                            <span className="text-slate-400">Active Network</span>
                            <span className="text-slate-100">{activeChain?.displayName}</span>
                        </div>
                        <div className="py-2.5 flex justify-between">
                            <span className="text-slate-400">Paymaster (Sponsor)</span>
                            <span className="text-slate-100 uppercase">{selectedPaymaster}</span>
                        </div>
                        <div className="py-2.5 flex justify-between">
                            <span className="text-slate-400">Bundler Node</span>
                            <span className="text-slate-100 uppercase">{selectedBundler}</span>
                        </div>
                        <div className="py-2.5 flex justify-between">
                            <span className="text-slate-400">Gas Sponsorship status</span>
                            <FeatureGate feature="gasSponsorship" fallback={<span className="text-red-400">Not Sponsored</span>}>
                                <span className="text-emerald-400 font-bold">Fully Sponsored</span>
                            </FeatureGate>
                        </div>
                        <div className="py-2.5 flex justify-between">
                            <span className="text-slate-400">Estimated Gas Limit</span>
                            <span className="font-mono text-slate-100">
                                {isEstimating ? 'Estimating...' : gasEstimateResult ? Number(gasEstimateResult).toLocaleString() : '—'}
                            </span>
                        </div>
                        {selectedSessionKey !== 'none' && (
                            <div className="py-2.5 flex justify-between">
                                <span className="text-slate-400">Session Key used</span>
                                <span className="font-mono text-slate-100">{selectedSessionKey.slice(0, 8)}...</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setPreviewOpen(false)}
                            className="border-slate-700 text-slate-300 hover:bg-slate-800"
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={handleExecuteTransaction}
                            loading={isExecuting}
                        >
                            Confirm Send
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* LIFECYCLE MONITOR MODAL */}
            <Dialog open={lifecycleOpen} onOpenChange={(open) => !open && !isExecuting && setLifecycleOpen(false)}>
                <DialogContent className="max-w-md bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-xl text-slate-100 animate-fade-in">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-lg font-bold flex items-center gap-2">
                            {activeTx ? (
                                activeTx.status === 'success' ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                ) : activeTx.status === 'failed' ? (
                                    <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                                ) : (
                                    <Activity className="w-5 h-5 text-primary animate-pulse shrink-0" />
                                )
                            ) : (
                                <Activity className="w-5 h-5 text-primary animate-pulse shrink-0" />
                            )}
                            Transaction Lifecycle
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-xs">
                            ERC-4337 UserOperation dispatch timeline status.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Timeline visualization */}
                    <div className="py-4">
                        <TransactionLifecycleTimeline
                            status={activeTx ? activeTx.status : 'pending'}
                            hash={activeTx?.hash}
                            failureReason={activeTx?.failureReason}
                            gasUsed={activeTx?.gasUsed}
                        />
                    </div>

                    {/* Success details summary */}
                    {activeTx && activeTx.status === 'success' && (
                        <div className="mt-4 p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2 text-xs font-semibold">
                            <h4 className="text-emerald-400 font-bold mb-1">✓ Execution Complete</h4>
                            {activeTx.hash && (
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Transaction Hash</span>
                                    <div className="flex items-center gap-1">
                                        <span className="font-mono text-slate-200">{activeTx.hash.slice(0, 10)}...{activeTx.hash.slice(-8)}</span>
                                        <button 
                                            onClick={() => handleCopy(activeTx.hash || '')}
                                            className="text-slate-400 hover:text-white transition-colors"
                                        >
                                            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>
                            )}
                            {activeTx.userOpHash && (
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">UserOp Hash</span>
                                    <div className="flex items-center gap-1">
                                        <span className="font-mono text-slate-200">{activeTx.userOpHash.slice(0, 10)}...{activeTx.userOpHash.slice(-8)}</span>
                                        <button 
                                            onClick={() => handleCopy(activeTx.userOpHash || '')}
                                            className="text-slate-400 hover:text-white transition-colors"
                                        >
                                            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>
                            )}
                            {activeTx.gasUsed && (
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Gas Used</span>
                                    <span className="font-mono text-slate-200">{activeTx.gasUsed}</span>
                                </div>
                            )}
                            {activeTx.hash && activeChain?.blockExplorer && (
                                <div className="pt-2 flex justify-end">
                                    <a
                                        href={`${activeChain.blockExplorer}/tx/${activeTx.hash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline flex items-center gap-1"
                                    >
                                        View on Explorer
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-6 flex justify-end">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={activeTx ? activeTx.status !== 'success' && activeTx.status !== 'failed' && activeTx.status !== 'cancelled' : true}
                            onClick={() => setLifecycleOpen(false)}
                            className="border-slate-700 text-slate-300 hover:bg-slate-800"
                        >
                            Close Timeline
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Private Key Prompt Dialog */}
            <Dialog open={showPrivateKeyPrompt} onOpenChange={setShowPrivateKeyPrompt}>
                <DialogContent className="max-w-md bg-slate-900 border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-white">Session Private Key Required</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            The private key for the selected session key could not be found locally. Please paste it below to sign the transaction.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input
                            type="password"
                            label="Session Private Key (Hex)"
                            placeholder="0x..."
                            value={inputSessionPrivateKey}
                            onChange={(e) => setInputSessionPrivateKey(e.target.value)}
                            className="bg-slate-950 border-slate-800 text-white font-mono"
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowPrivateKeyPrompt(false);
                                setInputSessionPrivateKey('');
                            }}
                            className="border-slate-800 text-slate-400"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            disabled={!inputSessionPrivateKey.startsWith('0x') || inputSessionPrivateKey.length !== 66}
                            onClick={() => {
                                setShowPrivateKeyPrompt(false);
                                handleExecuteTransaction();
                            }}
                        >
                            Sign & Execute
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
