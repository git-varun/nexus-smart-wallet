import {transactionRepository} from '../repositories';
import {createServiceLogger, getRPC_URL, metrics} from '../utils';
import {Address, getAddress, Hex, isAddress, parseEther, zeroAddress} from 'viem'
import {entryPoint06Address, entryPoint07Address} from "viem/account-abstraction";
import {TransactionInfo, TransactionRequest} from '../types';
import {getUserAccount} from "./account.service";
import {IAccount, NonceModel, ITransaction} from "../models";
import {updateAccount} from "../repositories/accountRepository";
import {TransactionQueryFilters} from "../repositories/transactionRepository";
import {rpcProvider, bundlerProvider, paymasterProvider} from "./provider.service";
import {notificationService} from "./notification.service";
import {getAccount} from "../scripts/permissionless";


const logger = createServiceLogger('TransactionService');

async function userAccount(userId: string, chainId: number, walletID: string): Promise<IAccount> {
    const smartAccountResult = await getUserAccount(userId, chainId, walletID);
    if (!smartAccountResult.success || !smartAccountResult.account) {
        throw new Error(smartAccountResult.error || 'Failed to get smart account');
    }
    return smartAccountResult.account;
}

function getEntryPointAddress(walletID: string): `0x${string}` {
    return walletID === "TRUST" ? (entryPoint06Address as `0x${string}`) : (entryPoint07Address as `0x${string}`);
}

async function getPaymaster(paymasterID: string, userOption: any, entryPointAddress: `0x${string}`, chainId: number): Promise<Record<string, any>> {
    return await paymasterProvider.getPaymasterStubData(paymasterID, userOption, entryPointAddress, chainId);
}

async function getGasPrice(bundlerId: string, chainId: number) {
    return bundlerProvider.getGasPrice(chainId, bundlerId);
}


export async function deploySmartAccountService(userId: string, chainId: number, walletID: string, paymasterID: string, bundlerId: string, idempotencyKey?: string) {
    try {
        const accountDetails = await userAccount(userId, chainId, walletID);
        if (accountDetails.isDeployed) {
            return {
                success: true,
                message: "Account already deployed",
                account: accountDetails
            };
        }

        // Check if bytecode already exists on-chain (redeploy verification)
        const client = rpcProvider.getPublicClient(chainId);
        const bytecode = await client.getBytecode({ address: accountDetails.address as `0x${string}` });
        if (bytecode && bytecode !== '0x') {
            logger.info(`Redeploy verification: Account ${accountDetails.address} is already deployed on-chain.`);
            await updateAccount(accountDetails.id, {
                isDeployed: true,
                isActive: true
            });
            // Update accountDetails local object
            accountDetails.isDeployed = true;
            accountDetails.isActive = true;
            return {
                success: true,
                message: "Account already deployed on-chain. Sync completed.",
                account: accountDetails
            };
        }

        // Check idempotency
        if (idempotencyKey) {
            const existing = await transactionRepository.findTransactionByIdempotencyKey(idempotencyKey);
            if (existing) {
                return {
                    success: true,
                    transaction: existing,
                    account: accountDetails
                };
            }
        }

        // Create queued transaction
        const transaction = await transactionRepository.createTransaction({
            userId: accountDetails.userId,
            accountId: accountDetails.address,
            to: zeroAddress,
            value: '0',
            data: '0x',
            bundlerID: bundlerId,
            paymasterID,
            walletID: accountDetails.walletID,
            chainId: accountDetails.chainId,
            status: 'queued',
            queuedAt: new Date(),
            idempotencyKey
        });

        logger.info("Deployment transaction enqueued", transaction.id);

        return {
            success: true,
            transaction: transaction,
            account: accountDetails,
        };
    } catch (error) {
        logger.error('Enqueue deploy failed', error instanceof Error ? error : new Error(String(error)));
        return {
            success: false,
            error
        };
    }
}

export async function sendTransaction(userId: string, chainId: number, walletID: string, paymasterID: string, bundlerId: string, request: TransactionRequest) {
    try {
        logger.info('initiated send transaction enqueue', {userId, chainId, ...request});

        if (!isAddress(request.to)) throw new Error(`Invalid recipient address: ${request.to}`);
        const checksummedTo = getAddress(request.to);

        // Check idempotency
        if (request.idempotencyKey) {
            const existing = await transactionRepository.findTransactionByIdempotencyKey(request.idempotencyKey);
            if (existing) {
                return {
                    success: true,
                    transaction: existing
                };
            }
        }

        const accountDetails = await userAccount(userId, chainId, walletID);

        const transaction = await transactionRepository.createTransaction({
            userId: accountDetails.userId,
            accountId: accountDetails.address,
            to: checksummedTo,
            value: request.value?.toString() || '0',
            data: request.data || '0x',
            bundlerID: bundlerId,
            paymasterID,
            walletID: accountDetails.walletID,
            chainId: accountDetails.chainId,
            status: 'queued',
            queuedAt: new Date(),
            idempotencyKey: request.idempotencyKey,
            sessionKeyAddress: request.sessionKeyAddress
        });

        logger.info("Transaction enqueued successfully", transaction.id);

        return {
            success: true,
            transaction: transaction
        };
    } catch (error) {
        logger.error('Transaction enqueue failed', error instanceof Error ? error : new Error(String(error)));
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Transaction enqueue failed'
        };
    }
}

export async function sendTransactionBatch(
    userId: string,
    chainId: number,
    walletID: string,
    paymasterID: string,
    bundlerId: string,
    request: {
        calls: { to: string; value?: string | number; data?: string }[];
        idempotencyKey?: string;
        sessionKeyAddress?: string;
    }
) {
    try {
        logger.info('initiated send transaction batch enqueue', {userId, chainId, callsCount: request.calls.length});

        // Validate recipient addresses in calls
        const validatedCalls = request.calls.map(call => {
            if (!isAddress(call.to)) throw new Error(`Invalid recipient address: ${call.to}`);
            return {
                to: getAddress(call.to),
                value: call.value?.toString() || '0',
                data: call.data || '0x'
            };
        });

        // Check idempotency
        if (request.idempotencyKey) {
            const existing = await transactionRepository.findTransactionByIdempotencyKey(request.idempotencyKey);
            if (existing) {
                return {
                    success: true,
                    transaction: existing
                };
            }
        }

        const accountDetails = await userAccount(userId, chainId, walletID);

        const transaction = await transactionRepository.createTransaction({
            userId: accountDetails.userId,
            accountId: accountDetails.address,
            calls: validatedCalls,
            bundlerID: bundlerId,
            paymasterID,
            walletID: accountDetails.walletID,
            chainId: accountDetails.chainId,
            status: 'queued',
            queuedAt: new Date(),
            idempotencyKey: request.idempotencyKey,
            sessionKeyAddress: request.sessionKeyAddress
        });

        logger.info("Batch transaction enqueued successfully", transaction.id);

        return {
            success: true,
            transaction: transaction
        };
    } catch (error) {
        logger.error('Transaction batch enqueue failed', error instanceof Error ? error : new Error(String(error)));
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Transaction batch enqueue failed'
        };
    }
}

export async function estimateGas(
    userId: string,
    chainId: number,
    walletID: string,
    paymasterID: string,
    bundlerId: string,
    request: TransactionRequest & { calls?: { to: string; value?: string | number; data?: string }[] }
): Promise<{ success: boolean, gasEstimate?: any, error?: Error | string }> {
    try {
        const accountDetails = await userAccount(userId, chainId, walletID);
        const gasPrice = await getGasPrice(bundlerId, accountDetails.chainId);
        const factory = accountDetails.walletID === "KERNEL" ? {} : {
            factory: accountDetails.providerInfo?.get("factory") as Hex,
            factoryData: accountDetails.providerInfo?.get("factoryData") as Hex
        };
        const client = await bundlerProvider.getBundlerClient(
            accountDetails.walletID,
            accountDetails.chainId,
            bundlerId,
            paymasterID,
            accountDetails
        );
        let paymaster: Record<string, any> = {};

        // Parse calls array or default to single call
        let callsToEstimate: { to: Address; value: bigint; data: Hex }[] = [];
        if (request.calls && request.calls.length > 0) {
            callsToEstimate = request.calls.map(c => {
                if (!isAddress(c.to)) throw new Error(`Invalid recipient address: ${c.to}`);
                return {
                    to: getAddress(c.to),
                    value: parseEther(c.value?.toString() || "0"),
                    data: c.data as Hex || "0x"
                };
            });
        } else {
            if (!isAddress(request.to || '')) throw new Error(`Invalid recipient address: ${request.to}`);
            callsToEstimate = [{
                to: getAddress(request.to!),
                value: parseEther(request.value?.toString() || "0"),
                data: request.data as Hex || "0x"
            }];
        }

        if (paymasterID === "ALCHEMY") {
            const userOp: any = await client.prepareUserOperation({
                calls: [{
                    to: zeroAddress,
                    value: parseEther('0'),
                }],

                ...factory,
                ...gasPrice
            })
            paymaster = await getPaymaster(paymasterID, userOp, getEntryPointAddress(accountDetails.walletID), chainId)
        }


        const gas = await client.estimateUserOperationGas({
            calls: callsToEstimate,

            ...factory,
            ...paymaster,
            ...gasPrice
        })

        if (!gas) return {
            success: false,
            gasEstimate: null
        }
        return {
            success: true,
            gasEstimate: gas,
        };

    } catch (error) {
        logger.error('Gas estimation failed', error instanceof Error ? error : new Error(String(error)));
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Gas estimation failed'
        };
    }
}

export async function getUserOperationStatus(chainId: number, userOpHash: string, bundlerId: string): Promise<{
    success: boolean,
    receipts?: TransactionInfo[],
    error?: Error | string
}> {
    try {
        logger.info('Getting user transaction stats', {bundlerId, chainId});

        const result = await bundlerProvider.getUserOperation(userOpHash as Hex, chainId, bundlerId);

        console.log(result)

        if (!result.status || !result.receipts?.length) throw new Error('Failed to get user operation status');

        result.receipts.forEach((receipt: {
            id: string,
            status: string;
            transactionHash: string;
            gasUsed: number;
        }) => {
            if (receipt.status === '0x1') {
                transactionRepository.findTransactionByHash(receipt.transactionHash);
            }
        })

        return {
            success: true,
            receipts: result.receipts
        }

    } catch (error) {
        logger.error('getting user transaction status is failed', error instanceof Error ? error : new Error(String(error)));
        return {
            success: false,
            error: error instanceof Error ? error.message : 'getting user transaction status is failed'
        };
    }
}

export async function getUserTransactionHistory(
    userId: string,
    filters: TransactionQueryFilters
): Promise<{
    success: boolean;
    transactions?: any[];
    pagination?: {
        totalCount: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    error?: Error | string;
}> {
    try {
        logger.info('Getting transaction history with filters', {userId, filters});

        const { transactions, totalCount, page, limit } = await transactionRepository.findTransactionsWithFilters(userId, filters);

        const transactionInfos = transactions.map(tx => ({
            id: tx.id,
            hash: tx.hash,
            userOpHash: tx.userOpHash || undefined,
            accountId: tx.accountId,
            to: tx.to,
            value: tx.value || '0',
            data: tx.data,
            bundlerID: tx.bundlerID,
            paymasterID: tx.paymasterID,
            walletID: tx.walletID,
            gasUsed: tx.gasUsed,
            chainId: tx.chainId,
            status: tx.status,
            failureReason: tx.failureReason,
            calls: tx.calls,
            createdAt: tx.createdAt,
            updatedAt: tx.updatedAt
        }));

        logger.info('Transaction history retrieved', {
            userId,
            count: transactionInfos.length,
            totalCount
        });

        return {
            success: true,
            transactions: transactionInfos,
            pagination: {
                totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        };

    } catch (error) {
        logger.error('Failed to get transaction history', error instanceof Error ? error : new Error(String(error)));
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get transaction history'
        };
    }
}

export async function getGasPriceObject(chainId: number, bundlerId: string): Promise<{
    success: boolean,
    gasPrice?: any,
    error?: Error | string
}> {
    try {
        logger.info('Getting gas price', {chainId, bundlerId});

        if (bundlerId) {
            const result = await bundlerProvider.getGasPriceRaw(chainId, bundlerId);

            return {
                success: true,
                gasPrice: result
            }
        }
        return {
            success: false,
            error: "Bundler not supported"
        }

    } catch (error) {
        logger.error('Failed to get gas price', error instanceof Error ? error : new Error(String(error)));
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get gas price'
        };
    }
}

export async function getNextNonce(
    smartAccountAddress: string,
    chainId: number,
    getOnChainNonce: () => Promise<bigint>
): Promise<bigint> {
    const onChainCount = await getOnChainNonce().catch(() => 0n);
    const onChainCountNum = Number(onChainCount);

    // eslint-disable-next-line no-constant-condition
    while (true) {
        // 1. Get the current database record or create it if missing
        const record = await NonceModel.findOneAndUpdate(
            { signerAddress: smartAccountAddress.toLowerCase(), chainId },
            { $setOnInsert: { nonce: onChainCountNum } },
            { upsert: true, new: true }
        );

        const currentVal = Math.max(record.nonce, onChainCountNum);

        // 2. Try to atomically update the nonce if it has not changed since we read it
        const res = await NonceModel.updateOne(
            {
                signerAddress: smartAccountAddress.toLowerCase(),
                chainId,
                nonce: record.nonce
            },
            { $set: { nonce: currentVal + 1 } }
        );

        if (res.modifiedCount > 0) {
            // Successfully claimed this nonce
            return BigInt(currentVal);
        }
        // Concurrent update occurred, retry loop
    }
}

function checkIfTransient(errorMsg: string): boolean {
    const transientKeywords = [
        'timeout', 'rate limit', 'network', '429', '503', '502', '504',
        'too many requests', 'underpriced', 'nonce too low', 'replace'
    ];
    return transientKeywords.some(keyword => errorMsg.toLowerCase().includes(keyword));
}

export async function executeTransactionOnChain(tx: ITransaction) {
    const startedAt = new Date();
    tx.startedAt = startedAt;
    tx.status = 'processing';
    await tx.save();

    try {
        const accountDetails = await userAccount(tx.userId, tx.chainId, tx.walletID || 'ALCHEMY');
        const gasPrice = await getGasPrice(tx.bundlerID || 'ALCHEMY', tx.chainId);
        const factory = accountDetails.walletID === "KERNEL" ? {} : {
            factory: accountDetails.providerInfo?.get("factory") as Hex,
            factoryData: accountDetails.providerInfo?.get("factoryData") as Hex
        };

        const client = await bundlerProvider.getBundlerClient(
            accountDetails.walletID,
            accountDetails.chainId,
            tx.bundlerID || 'ALCHEMY',
            tx.paymasterID || 'ALCHEMY',
            accountDetails
        );

        let paymasterData = {};
        if (tx.paymasterID === "ALCHEMY") {
            const userOp: any = await client.prepareUserOperation({
                calls: [{
                    to: zeroAddress,
                    value: parseEther('0'),
                }],
                ...factory,
                ...gasPrice
            });
            const pmStart = Date.now();
            paymasterData = await getPaymaster(tx.paymasterID, userOp, getEntryPointAddress(accountDetails.walletID), tx.chainId);
            metrics.trackPaymasterCall(Date.now() - pmStart);
        }

        const isDeployment = !accountDetails.isDeployed && tx.to === zeroAddress;
        
        // Nonce and endpoint tracking
        const nextNonce = await getNextNonce(
            accountDetails.address,
            tx.chainId,
            async () => {
                const smartAccount = await getAccount(accountDetails.walletID, accountDetails);
                return await smartAccount.getNonce();
            }
        );
        tx.rpcEndpoint = getRPC_URL(tx.chainId, tx.bundlerID);

        let hash: Hex;
        const bundlerStart = Date.now();
        if (isDeployment) {
            hash = await client.sendUserOperation({
                calls: [{
                    to: zeroAddress,
                    value: parseEther('0'),
                }],
                nonce: nextNonce,
                ...paymasterData,
                ...factory,
                ...gasPrice
            });
        } else if (tx.calls && tx.calls.length > 0) {
            hash = await client.sendUserOperation({
                calls: tx.calls.map(c => ({
                    to: getAddress(c.to),
                    data: c.data as Hex || '0x',
                    value: parseEther(c.value || '0')
                })),
                nonce: nextNonce,
                ...paymasterData,
                ...gasPrice
            });
        } else {
            hash = await client.sendUserOperation({
                calls: [{
                    to: getAddress(tx.to!),
                    data: tx.data as Hex || '0x',
                    value: parseEther(tx.value || '0')
                }],
                nonce: nextNonce,
                ...paymasterData,
                ...gasPrice
            });
        }
        metrics.trackBundlerCall(Date.now() - bundlerStart);

        const submittedAt = new Date();
        tx.userOpHash = hash;
        tx.status = 'submitted';
        tx.submittedAt = submittedAt;
        await tx.save();

        const confStart = Date.now();
        const receipt = await client.waitForUserOperationReceipt({ hash });
        metrics.trackConfirmation(Date.now() - confStart);
        const confirmedAt = new Date();
        tx.confirmedAt = confirmedAt;

        if (receipt && receipt.success) {
            tx.status = 'confirmed';
            tx.hash = receipt.receipt.transactionHash;
            tx.gasUsed = receipt.actualGasUsed?.toString();
            
            if (isDeployment) {
                await updateAccount(accountDetails.id, {
                    isDeployed: true,
                    isActive: true
                });
                notificationService.sendNotification(tx.userId, "deployment.complete", {
                    transactionId: tx.id,
                    accountId: tx.accountId,
                    hash: tx.hash
                });
            } else {
                notificationService.sendNotification(tx.userId, "transaction.confirmed", {
                    transactionId: tx.id,
                    accountId: tx.accountId,
                    hash: tx.hash
                });
            }
        } else {
            tx.status = 'failed';
            tx.failureReason = 'UserOperation reverted on-chain';
            notificationService.sendNotification(tx.userId, "transaction.failed", {
                transactionId: tx.id,
                accountId: tx.accountId,
                error: tx.failureReason
            });
        }
        
        tx.completedAt = new Date();
        tx.executionDuration = tx.completedAt.getTime() - tx.startedAt.getTime();
        tx.queueDuration = tx.startedAt.getTime() - tx.queuedAt!.getTime();
        tx.blockchainDuration = tx.confirmedAt.getTime() - tx.submittedAt.getTime();
        await tx.save();

    } catch (error: any) {
        const errorMsg = error?.message || String(error);
        const isTransient = checkIfTransient(errorMsg);

        if (isTransient && tx.retryCount < 5) {
            tx.status = 'retrying';
            tx.retryCount += 1;
            tx.failureReason = `Transient failure: ${errorMsg}`;
            notificationService.sendNotification(tx.userId, "transaction.retry_started", {
                transactionId: tx.id,
                retryCount: tx.retryCount,
                error: tx.failureReason
            });
        } else {
            tx.status = 'failed';
            tx.failureReason = `Permanent failure: ${errorMsg}`;
            tx.completedAt = new Date();
            tx.executionDuration = tx.completedAt.getTime() - tx.startedAt.getTime();
            notificationService.sendNotification(tx.userId, "transaction.failed", {
                transactionId: tx.id,
                accountId: tx.accountId,
                error: tx.failureReason
            });
        }
        await tx.save();
        logger.error('Worker transaction execution failed', error);
    }
}
