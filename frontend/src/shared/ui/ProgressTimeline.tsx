import React, { useMemo } from 'react';
import { cn } from '@/shared/lib/cn';
import { Address } from 'viem';

export interface TimelineStep {
    id: string;
    title: string;
    description?: string;
    status: 'pending' | 'active' | 'success' | 'error';
}

export interface ProgressTimelineProps {
    steps: TimelineStep[];
    className?: string;
}

export const ProgressTimeline: React.FC<ProgressTimelineProps> = ({
    steps,
    className
}) => {
    return (
        <div className={cn("flow-root", className)}>
            <ul role="list" className="-mb-8">
                {steps.map((step, stepIdx) => {
                    const isLast = stepIdx === steps.length - 1;
                    const isActive = step.status === 'active';
                    const isCompleted = step.status === 'success';
                    const isFailed = step.status === 'error';

                    return (
                        <li key={step.id}>
                            <div className="relative pb-8">
                                {!isLast && (
                                    <span
                                        className={cn(
                                            "absolute left-4 top-4 -ml-px h-full w-0.5 bg-border/60",
                                            isCompleted && "bg-primary"
                                        )}
                                        aria-hidden="true"
                                    />
                                )}
                                <div className="relative flex space-x-3 items-start">
                                    <div>
                                        <span
                                            className={cn(
                                                "h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-background",
                                                step.status === 'pending' && "bg-muted/40 text-muted-foreground",
                                                isActive && "bg-primary/20 text-primary border border-primary animate-pulse",
                                                isCompleted && "bg-primary text-primary-foreground",
                                                isFailed && "bg-red-500/10 text-red-500 border border-red-500"
                                            )}
                                        >
                                            {isCompleted ? (
                                                <svg className="h-5 w-5 text-current" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            ) : isFailed ? (
                                                <span className="text-sm font-bold">✕</span>
                                            ) : (
                                                <span className="text-xs font-semibold">{stepIdx + 1}</span>
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                                        <div className="space-y-0.5">
                                            <p className={cn(
                                                "text-sm font-semibold text-foreground",
                                                isActive && "text-primary font-bold"
                                            )}>
                                                {step.title}
                                            </p>
                                            {step.description && (
                                                <p className="text-xs text-muted-foreground">
                                                    {step.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

// -------------------------------------------------------------
// Transaction Lifecycle Timeline wrapper (Phase 7)
// -------------------------------------------------------------
interface TxLifecycleProps {
    status: 'pending' | 'queued' | 'processing' | 'submitted' | 'success' | 'failed' | 'retrying' | 'cancelled';
    failureReason?: string;
    hash?: string;
    gasUsed?: string;
    className?: string;
}

export const TransactionLifecycleTimeline: React.FC<TxLifecycleProps> = ({
    status,
    failureReason,
    hash,
    gasUsed,
    className
}) => {
    const steps: TimelineStep[] = useMemo(() => {
        const getStepStatus = (stepIdx: number): 'pending' | 'active' | 'success' | 'error' => {
            if (status === 'failed') {
                return stepIdx === 3 ? 'error' : 'success';
            }
            if (status === 'cancelled') {
                return stepIdx === 3 ? 'error' : 'success';
            }

            switch (status) {
                case 'pending':
                case 'queued':
                    return stepIdx === 0 ? 'active' : 'pending';
                case 'processing':
                case 'retrying':
                    return stepIdx === 1 ? 'active' : stepIdx === 0 ? 'success' : 'pending';
                case 'submitted':
                    return stepIdx === 2 ? 'active' : stepIdx < 2 ? 'success' : 'pending';
                case 'success':
                    return 'success';
                default:
                    return 'pending';
            }
        };

        return [
            {
                id: 'queued',
                title: 'Operation Queued',
                description: 'UserOperation request payload generated and signature verified.',
                status: getStepStatus(0)
            },
            {
                id: 'processing',
                title: status === 'retrying' ? 'Retrying Operation' : 'Sponsorship & Gas Resolution',
                description: status === 'retrying' 
                    ? 'Retrying gas parameter estimation due to network congestion.' 
                    : 'Estimating limits and obtaining sponsorship proof from Paymaster.',
                status: getStepStatus(1)
            },
            {
                id: 'submitted',
                title: 'Submitted on-chain',
                description: hash 
                    ? `Dispatched by Bundler. Tx: ${hash.substring(0, 14)}...`
                    : 'Awaiting dispatch to entrypoint contract by the bundler node.',
                status: getStepStatus(2)
            },
            {
                id: 'confirmed',
                title: status === 'failed' ? 'Execution Failed' : 'Confirmed',
                description: status === 'failed'
                    ? `Transaction reverted: ${failureReason || 'unknown revert reason'}`
                    : gasUsed 
                        ? `Transaction confirmed in block. Gas Used: ${gasUsed}`
                        : 'Confirmed. Value transferred and state verified on-chain.',
                status: getStepStatus(3)
            }
        ];
    }, [status, failureReason, hash, gasUsed]);

    return <ProgressTimeline steps={steps} className={className} />;
};

// -------------------------------------------------------------
// Deployment Lifecycle Timeline wrapper (Phase 7)
// -------------------------------------------------------------
interface DeployLifecycleProps {
    isDeployed: boolean;
    address?: Address;
    className?: string;
    loading?: boolean;
}

export const DeploymentLifecycleTimeline: React.FC<DeployLifecycleProps> = ({
    isDeployed,
    address,
    className,
    loading = false
}) => {
    const steps: TimelineStep[] = useMemo(() => {
        return [
            {
                id: 'init',
                title: 'Smart Account Created',
                description: address ? `Counterfactual address: ${address.substring(0, 14)}...` : 'Pending address mapping...',
                status: 'success'
            },
            {
                id: 'funding',
                title: 'Gas Policy Verification',
                description: 'Checking gas limits and sponsorship configurations.',
                status: isDeployed ? 'success' : loading ? 'active' : 'pending'
            },
            {
                id: 'deploying',
                title: 'Dispatching Deployment',
                description: 'Submitting first transaction payload containing initcode parameter.',
                status: isDeployed ? 'success' : loading ? 'active' : 'pending'
            },
            {
                id: 'completed',
                title: 'On-chain Verification',
                description: isDeployed ? 'Account successfully deployed on-chain.' : 'Pending deployment receipt.',
                status: isDeployed ? 'success' : 'pending'
            }
        ];
    }, [isDeployed, address, loading]);

    return <ProgressTimeline steps={steps} className={className} />;
};
