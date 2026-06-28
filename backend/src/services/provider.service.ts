import { createPublicClient, http, defineChain, PublicClient, Address, Hex } from "viem";
import { createBundlerClient, createPaymasterClient } from "viem/account-abstraction";
import { getAccount } from "../scripts/permissionless";
import { getAlchemyPaymasterStubData, getUserOperationByHash } from "../scripts/alchemyApi";
import { getUserOperationGasPrice, getUserOperationStatus_PM } from "../scripts/pimlicoApi";
import { getRPC_URL } from "../utils/helpers";
import { IAccount } from "../models";
import { ALCHEMY_CHAIN_MAP } from "../config/chain";

// 1. Interfaces
export interface IRpcProvider {
    getPublicClient(chainId: number): PublicClient;
    getTransactionCount(address: Address, chainId: number): Promise<number>;
}

export interface IPaymasterProvider {
    id: string;
    getPaymasterClient(chainId: number): any;
    getPaymasterStubData(
        userOp: any,
        entryPointAddress: Address,
        chainId: number
    ): Promise<any>;
}

export interface IBundlerProvider {
    id: string;
    getBundlerClient(
        walletID: string,
        chainId: number,
        pmClient: any,
        accountConfig: IAccount
    ): Promise<any>;
    getUserOperation(hash: Hex, chainId: number): Promise<any>;
    getGasPrice(chainId: number): Promise<{ maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }>;
    getGasPriceRaw(chainId: number): Promise<any>;
}

// 2. Registry
class ProviderRegistry {
    private bundlerProviders = new Map<string, IBundlerProvider>();
    private paymasterProviders = new Map<string, IPaymasterProvider>();
    private rpcProvider: IRpcProvider | null = null;

    public registerBundler(provider: IBundlerProvider): void {
        this.bundlerProviders.set(provider.id.toUpperCase(), provider);
    }

    public registerPaymaster(provider: IPaymasterProvider): void {
        this.paymasterProviders.set(provider.id.toUpperCase(), provider);
    }

    public registerRpc(provider: IRpcProvider): void {
        this.rpcProvider = provider;
    }

    public getBundler(id: string): IBundlerProvider {
        const provider = this.bundlerProviders.get(id.toUpperCase());
        if (!provider) {
            throw new Error(`Bundler provider ${id} is not registered.`);
        }
        return provider;
    }

    public getPaymaster(id: string): IPaymasterProvider {
        const provider = this.paymasterProviders.get(id.toUpperCase());
        if (!provider) {
            throw new Error(`Paymaster provider ${id} is not registered.`);
        }
        return provider;
    }

    public getRpc(): IRpcProvider {
        if (!this.rpcProvider) {
            throw new Error("RPC provider is not registered.");
        }
        return this.rpcProvider;
    }
}

export const providerRegistry = new ProviderRegistry();

// 3. Concrete Implementations

// RPC Provider with Bounded Cache & Chain ID Whitelist (Constructor Injected)
class ViemRpcProvider implements IRpcProvider {
    private clients = new Map<number, PublicClient>();
    private maxCacheSize = 10;

    constructor(
        private rpcUrlResolver: (chainId: number) => string,
        maxCache: number = 10
    ) {
        this.maxCacheSize = maxCache;
    }

    private getChain(chainId: number) {
        return defineChain({
            id: chainId,
            name: `Chain ${chainId}`,
            nativeCurrency: {name: "Ether", symbol: "ETH", decimals: 18},
            rpcUrls: {
                default: {http: [this.rpcUrlResolver(chainId)]}
            }
        });
    }

    public getPublicClient(chainId: number): PublicClient {
        // Whitelist supported chain IDs
        if (!(chainId in ALCHEMY_CHAIN_MAP)) {
            throw new Error(`Unsupported chain ID: ${chainId}`);
        }

        let client = this.clients.get(chainId);
        if (!client) {
            // Enforce Cache Eviction Policy
            if (this.clients.size >= this.maxCacheSize) {
                const firstKey = this.clients.keys().next().value;
                if (firstKey !== undefined) {
                    this.clients.delete(firstKey);
                }
            }

            client = createPublicClient({
                chain: this.getChain(chainId),
                transport: http(this.rpcUrlResolver(chainId))
            });
            this.clients.set(chainId, client);
        }
        return client;
    }

    public async getTransactionCount(address: Address, chainId: number): Promise<number> {
        const client = this.getPublicClient(chainId);
        return client.getTransactionCount({ address });
    }
}

// Alchemy Concrete Providers (Constructor Injected)
class AlchemyBundlerProvider implements IBundlerProvider {
    public id = "ALCHEMY";

    constructor(private rpcUrlResolver: (chainId: number, provider?: string) => string) {}

    public async getBundlerClient(
        walletID: string,
        chainId: number,
        pmClient: any,
        accountConfig: IAccount
    ): Promise<any> {
        const account = await getAccount(walletID, accountConfig);
        return createBundlerClient({
            account,
            paymaster: pmClient,
            transport: http(this.rpcUrlResolver(chainId, this.id))
        });
    }

    public async getUserOperation(hash: Hex, _chainId: number): Promise<any> {
        return getUserOperationByHash(hash);
    }

    public async getGasPrice(_chainId: number): Promise<{ maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }> {
        return {
            maxFeePerGas: BigInt(1500000000), // 1.5 gwei fallback
            maxPriorityFeePerGas: BigInt(100000000) // 0.1 gwei fallback
        };
    }

    public async getGasPriceRaw(_chainId: number): Promise<any> {
        return {
            gasPrice: {
                fast: { maxFeePerGas: "0x59682f00", maxPriorityFeePerGas: "0x5f5e100" },
                standard: { maxFeePerGas: "0x59682f00", maxPriorityFeePerGas: "0x5f5e100" },
                slow: { maxFeePerGas: "0x59682f00", maxPriorityFeePerGas: "0x5f5e100" }
            }
        };
    }
}

class AlchemyPaymasterProvider implements IPaymasterProvider {
    public id = "ALCHEMY";

    public getPaymasterClient(_chainId: number): any {
        return undefined; // Alchemy paymaster is handled implicitly via the Alchemy bundler client URL
    }

    public async getPaymasterStubData(
        userOp: any,
        entryPointAddress: Address,
        chainId: number
    ): Promise<any> {
        return getAlchemyPaymasterStubData(userOp, entryPointAddress, chainId);
    }
}

// Pimlico Concrete Providers (Constructor Injected)
class PimlicoBundlerProvider implements IBundlerProvider {
    public id = "PIMLICO";

    constructor(private rpcUrlResolver: (chainId: number, provider?: string) => string) {}

    public async getBundlerClient(
        walletID: string,
        chainId: number,
        pmClient: any,
        accountConfig: IAccount
    ): Promise<any> {
        const account = await getAccount(walletID, accountConfig);
        return createBundlerClient({
            account,
            paymaster: pmClient,
            transport: http(this.rpcUrlResolver(chainId, this.id))
        });
    }

    public async getUserOperation(hash: Hex, chainId: number): Promise<any> {
        return getUserOperationStatus_PM(hash, chainId);
    }

    public async getGasPrice(chainId: number): Promise<{ maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }> {
        const result: any = await getUserOperationGasPrice(chainId);
        return {
            maxFeePerGas: BigInt(result?.gasPrice?.fast.maxFeePerGas),
            maxPriorityFeePerGas: BigInt(result?.gasPrice?.fast.maxPriorityFeePerGas),
        };
    }

    public async getGasPriceRaw(chainId: number): Promise<any> {
        return getUserOperationGasPrice(chainId);
    }
}

class PimlicoPaymasterProvider implements IPaymasterProvider {
    public id = "PIMLICO";

    constructor(private rpcUrlResolver: (chainId: number, provider?: string) => string) {}

    public getPaymasterClient(chainId: number): any {
        const paymasterRPC = this.rpcUrlResolver(chainId, this.id);
        return createPaymasterClient({
            transport: http(paymasterRPC),
        });
    }

    public async getPaymasterStubData(
        _userOp: any,
        _entryPointAddress: Address,
        _chainId: number
    ): Promise<any> {
        // Implement stub logic or sponsorship request if required
        return {};
    }
}

// 4. Registry initialization at startup (Composition Root with Dependency Injection)
providerRegistry.registerRpc(new ViemRpcProvider((chainId) => getRPC_URL(chainId)));
providerRegistry.registerBundler(new AlchemyBundlerProvider((chainId, provider) => getRPC_URL(chainId, provider)));
providerRegistry.registerBundler(new PimlicoBundlerProvider((chainId, provider) => getRPC_URL(chainId, provider)));
providerRegistry.registerPaymaster(new AlchemyPaymasterProvider());
providerRegistry.registerPaymaster(new PimlicoPaymasterProvider((chainId, provider) => getRPC_URL(chainId, provider)));

// 5. Delegate Export Classes to keep business interfaces intact
class EVMBundlerProviderDelegate {
    public async getBundlerClient(
        walletID: string,
        chainId: number,
        bundlerID: string,
        paymasterID: string,
        accountConfig: IAccount
    ): Promise<any> {
        const bundler = providerRegistry.getBundler(bundlerID);
        const paymaster = paymasterID ? providerRegistry.getPaymaster(paymasterID) : null;
        const pmClient = paymaster ? paymaster.getPaymasterClient(chainId) : undefined;
        return bundler.getBundlerClient(walletID, chainId, pmClient, accountConfig);
    }

    public async getUserOperationReceipt(
        hash: Hex,
        chainId: number,
        walletID: string,
        bundlerID: string,
        paymasterID: string,
        accountConfig: IAccount
    ): Promise<any> {
        const client = await this.getBundlerClient(walletID, chainId, bundlerID, paymasterID, accountConfig);
        return client.waitForUserOperationReceipt({ hash });
    }

    public async getUserOperation(hash: Hex, chainId: number, bundlerID: string): Promise<any> {
        const bundler = providerRegistry.getBundler(bundlerID);
        return bundler.getUserOperation(hash, chainId);
    }

    public async getGasPrice(chainId: number, bundlerID: string): Promise<{ maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }> {
        const bundler = providerRegistry.getBundler(bundlerID);
        return bundler.getGasPrice(chainId);
    }

    public async getGasPriceRaw(chainId: number, bundlerID: string): Promise<any> {
        const bundler = providerRegistry.getBundler(bundlerID);
        return bundler.getGasPriceRaw(chainId);
    }
}

class EVMPaymasterProviderDelegate {
    public async getPaymasterStubData(
        paymasterID: string,
        userOp: any,
        entryPointAddress: Address,
        chainId: number
    ): Promise<any> {
        const paymaster = providerRegistry.getPaymaster(paymasterID);
        return paymaster.getPaymasterStubData(userOp, entryPointAddress, chainId);
    }
}

class ViemRpcProviderDelegate implements IRpcProvider {
    public getPublicClient(chainId: number): PublicClient {
        return providerRegistry.getRpc().getPublicClient(chainId);
    }
    public async getTransactionCount(address: Address, chainId: number): Promise<number> {
        return providerRegistry.getRpc().getTransactionCount(address, chainId);
    }
}

// 6. Export singletons matching legacy interfaces for simple dependency integration
export const rpcProvider: IRpcProvider = new ViemRpcProviderDelegate();
export const bundlerProvider = new EVMBundlerProviderDelegate();
export const paymasterProvider = new EVMPaymasterProviderDelegate();
