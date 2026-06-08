import {transactionRepository} from '../repositories';
import {createServiceLogger} from '../utils';
import {getAlchemyPaymasterStubData, getUserOperationByHash} from "../scripts/alchemyApi";
import {getUserOperationGasPrice, getUserOperationStatus_PM} from "../scripts/pimlicoApi";
import {getAddress, Hex, isAddress, parseEther, zeroAddress} from 'viem'
import {entryPoint07Address, UserOperationReceipt} from "viem/account-abstraction";
import {TransactionInfo, TransactionRequest} from '../types';
import {getUserAccount} from "./account.service";
import {IAccount} from "../models";
import {bundlerClient} from "../scripts/permissionless";
import {updateAccount} from "../repositories/accountRepository";
import {createTransaction} from "../repositories/transactionRepository";


const logger = createServiceLogger('TransactionService');

async function userAccount(userId: string, chainId: number, walletID: string): Promise<IAccount> {
    const smartAccountResult = await getUserAccount(userId, chainId, walletID);
    if (!smartAccountResult.success || !smartAccountResult.account) {
        throw new Error(smartAccountResult.error || 'Failed to get smart account');
    }
    return smartAccountResult.account;
}

async function getPaymaster(paymasterID: string, userOption: any, entryPointAddress: `0x${string}`, chainId: number): Promise<Record<string, any>> {
    if (paymasterID === "ALCHEMY") {
        return await getAlchemyPaymasterStubData(userOption, entryPointAddress, chainId) as Record<string, any>;
    }
    return {};
}

async function getGasPrice(bundlerId: string, chainId: number) {
    if (bundlerId === "PIMLICO") {
        const result: any = await getUserOperationGasPrice(chainId);
        return {
            maxFeePerGas: BigInt(result?.gasPrice?.fast.maxFeePerGas),
            maxPriorityFeePerGas: BigInt(result?.gasPrice?.fast.maxPriorityFeePerGas),
        };
    }
}


export async function deploySmartAccountService(userId: string, chainId: number, walletID: string, paymasterID: string, bundlerId: string) {

    try {
        const accountDetails = await userAccount(userId, chainId, walletID);
        if (accountDetails.isDeployed) throw Error(`Deployed account ${userId} already deployed`);
        const gasPrice = await getGasPrice(bundlerId, accountDetails.chainId);
        const factory = accountDetails.walletID === "KERNEL" ? {} : {
            factory: accountDetails.providerInfo?.get("factory") as Hex,
            factoryData: accountDetails.providerInfo?.get("factoryData") as Hex
        }

        const client = await bundlerClient(accountDetails.walletID, accountDetails.chainId, bundlerId, paymasterID, accountDetails);
        let paymasterData = {};
        if (paymasterID === "ALCHEMY") {
            const userOp: any = await client.prepareUserOperation({
                calls: [{
                    to: zeroAddress,
                    value: parseEther('0'),
                }],

                ...factory,
                ...gasPrice
            })
            paymasterData = await getPaymaster(paymasterID, userOp, entryPoint07Address, chainId)
        }

        const hash = await client.sendUserOperation({
            calls: [{
                to: zeroAddress,
                value: parseEther('0'),
            }],

            ...paymasterData,
            ...factory,
            ...gasPrice
        })
        const receipt: UserOperationReceipt = await client.waitForUserOperationReceipt({
            hash
        })

        if (receipt) {
            let updatedAcc: IAccount | null = null;
            if (receipt.success) {
                updatedAcc = await updateAccount(accountDetails.id, {
                    isDeployed: true,
                    isActive: true
                })
                logger.info("Updated smart account", updatedAcc);
            }

            const transaction = await createTransaction({
                userId: accountDetails.userId,
                accountId: accountDetails.address,
                hash: receipt.receipt.transactionHash,
                userOpHash: receipt.userOpHash,
                to: zeroAddress,
                value: '0',
                data: '0x',
                bundlerID: bundlerId,
                paymasterID,
                walletID: accountDetails.walletID,
                gasUsed: receipt.actualGasUsed?.toString(),
                chainId: accountDetails.chainId,
                status: receipt.success ? "confirmed" : "failed"
            })

            logger.info("Transaction successfully created", transaction);

            return {
                success: true,
                transaction: transaction,
                account: updatedAcc,
            };
        }
        return {
            success: false,
            transaction: hash,
            account: null,
        };
    } catch (error) {
        logger.error('Deploy transaction failed', error instanceof Error ? error : new Error(String(error)));
        return {
            success: false,
            error
        };
    }

}

export async function sendTransaction(userId: string, chainId: number, walletID: string, paymasterID: string, bundlerId: string, request: TransactionRequest) {
    try {

        logger.info('initiated', {userId, chainId, ...request});

        if (!isAddress(request.to)) throw new Error(`Invalid recipient address: ${request.to}`);
        const checksummedTo = getAddress(request.to);

        const accountDetails = await userAccount(userId, chainId, walletID);
        const gasPrice = await getGasPrice(bundlerId, accountDetails.chainId);
        const factory = accountDetails.walletID === "KERNEL" ? {} : {
            factory: accountDetails.providerInfo?.get("factory") as Hex,
            factoryData: accountDetails.providerInfo?.get("factoryData") as Hex
        }

        const client = await bundlerClient(accountDetails.walletID, accountDetails.chainId, bundlerId, paymasterID, accountDetails);

        let paymasterData: Record<string, any> = {};
        if (paymasterID === "ALCHEMY") {
            const userOp: any = await client.prepareUserOperation({
                calls: [{
                    to: zeroAddress,
                    value: parseEther('0'),
                }],

                ...factory,
                ...gasPrice
            })
            paymasterData = await getPaymaster(paymasterID, userOp, entryPoint07Address, chainId)
        }

        const hash = await client.sendUserOperation({
            calls: [{
                to: checksummedTo,
                data: request.data,
                value: parseEther(request.value?.toString() || "0")
            }],

            ...paymasterData,
            ...gasPrice
        })
        const receipt: UserOperationReceipt = await client.waitForUserOperationReceipt({
            hash
        })

        if (receipt) {

            const transaction = await transactionRepository.createTransaction({
                userId: accountDetails.userId,
                accountId: accountDetails.address,
                hash: receipt.receipt.transactionHash,
                userOpHash: receipt.userOpHash,
                to: checksummedTo,
                value: request.value?.toString() || '0',
                data: request.data || '0x',
                bundlerID: bundlerId,
                paymasterID,
                walletID: accountDetails.walletID,
                gasUsed: receipt.actualGasUsed?.toString(),
                chainId: accountDetails.chainId,
                status: receipt.success ? "confirmed" : "failed"
            })

            logger.info("Transaction successfully created", transaction);

            return {
                success: true,
                transaction: transaction,
            };
        }
        return {
            success: false,
            transaction: hash,
        };
    } catch (error) {
        logger.error('Transaction failed', error instanceof Error ? error : new Error(String(error)));

        return {
            success: false,
            error: error instanceof Error ? new Error(String(error)) : 'Transaction failed'
        };
    }
}

export async function estimateGas(
    userId: string,
    chainId: number,
    walletID: string,
    paymasterID: string,
    bundlerId: string,
    request: TransactionRequest
): Promise<{ success: boolean, gasEstimate?: any, error?: Error | string }> {
    try {

        if (!isAddress(request.to)) throw new Error(`Invalid recipient address: ${request.to}`);
        const checksummedTo = getAddress(request.to);

        const accountDetails = await userAccount(userId, chainId, walletID);
        const gasPrice = await getGasPrice(bundlerId, accountDetails.chainId);
        const factory = accountDetails.walletID === "KERNEL" ? {} : {
            factory: accountDetails.providerInfo?.get("factory") as Hex,
            factoryData: accountDetails.providerInfo?.get("factoryData") as Hex
        };
        const client = await bundlerClient(accountDetails.walletID, accountDetails.chainId, bundlerId, paymasterID, accountDetails);
        let paymaster: Record<string, any> = {};
        if (paymasterID === "ALCHEMY") {
            const userOp: any = await client.prepareUserOperation({
                calls: [{
                    to: zeroAddress,
                    value: parseEther('0'),
                }],

                ...factory,
                ...gasPrice
            })
            paymaster = await getPaymaster(paymasterID, userOp, entryPoint07Address, chainId)
        }


        const gas = await client.estimateUserOperationGas({
            calls: [{
                to: checksummedTo,
                data: request.data,
                value: parseEther(request.value?.toString() || "0")
            }],

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

        let result: any;
        if (bundlerId === "ALCHEMY") {
            result = await getUserOperationByHash(userOpHash);
        }
        if (bundlerId === "PIMLICO") {
            result = await getUserOperationStatus_PM(userOpHash, chainId)
        }

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

export async function getUserTransactionHistory(userId: string, chainId?: number): Promise<{
    success: boolean,
    transactions?: any,
    error?: Error | string
}> {
    try {
        logger.info('Getting transaction history', {userId, chainId});

        const transactions = await transactionRepository.findTransactionsByUserId(userId, chainId);

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
            createdAt: tx.createdAt,
            updatedAt: tx.updatedAt
        }));

        logger.info('Transaction history retrieved', {
            userId,
            chainId,
            count: transactionInfos.length
        });

        return {
            success: true,
            transactions: transactionInfos
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
            const result = await getUserOperationGasPrice(chainId);

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
