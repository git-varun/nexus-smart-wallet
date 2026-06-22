import {
    toKernelSmartAccount,
    toLightSmartAccount,
    toNexusSmartAccount,
    toSafeSmartAccount,
    toSimpleSmartAccount,
    toTrustSmartAccount
} from "permissionless/accounts"
import {
    entryPoint06Address,
    entryPoint07Address,
    SmartAccount
} from "viem/account-abstraction"
import {createServiceLogger, generateSalt, getCentralAccount, getRPC_URL} from "../utils";
import {Address, createPublicClient, defineChain, http} from "viem";
import {IAccount} from "../models";

const logger = createServiceLogger("Accounts Script");

function getChain(chainId: number) {
    return defineChain({
        id: chainId,
        name: `Chain ${chainId}`,
        nativeCurrency: {name: "Ether", symbol: "ETH", decimals: 18},
        rpcUrls: {
            default: {http: [getRPC_URL(chainId)]}
        }
    });
}

export async function getAccount(walletID: string, accountDetails: IAccount): Promise<SmartAccount> {

    const entryPoint = {
        address: entryPoint07Address as `0x${string}`,
        version: "0.7" as any
    };
    const smartAccountAddress: Address | undefined = accountDetails.isDeployed ? accountDetails.address as Address : undefined;
    const saltNonce = BigInt(generateSalt(accountDetails.userId, accountDetails.chainId));


    const publicClient = createPublicClient({
        chain: getChain(accountDetails.chainId),
        transport: http(getRPC_URL(accountDetails.chainId))
    })

    const owner = await getCentralAccount();

    // logger.info("Account Details", {entryPoint, owner, smartAccountAddress, saltNonce})

    if (walletID === "KERNEL")
        return toKernelSmartAccount({
            client: publicClient,
            owners: [owner],
            entryPoint,
            index: saltNonce,
            address: smartAccountAddress,
            version: entryPoint.version === "0.7" ? "0.3.1" : "0.2.4"
        });

    if (walletID === "SIMPLE")
        return toSimpleSmartAccount({
            owner,
            client: publicClient,
            entryPoint,
            index: saltNonce,
            address: smartAccountAddress
        })

    if (walletID === "ALCHEMY")
        return toLightSmartAccount({
            client: publicClient,
            version: entryPoint.version === "0.7" ? "2.0.0" : "1.1.0",
            entryPoint,
            owner,
            index: saltNonce,
            address: smartAccountAddress,
        })

    if (walletID === "TRUST")
        return toTrustSmartAccount({
            client: publicClient,
            entryPoint: {
                address: entryPoint06Address as `0x${string}`,
                version: "0.6"
            },
            owner,
            index: saltNonce,
            address: smartAccountAddress
        })

    if (walletID === "BICONOMY")
        return toNexusSmartAccount({
            owners: [owner],
            client: publicClient,
            entryPoint: {
                address: entryPoint07Address,
                version: "0.7"
            },
            version: "1.0.0",
            index: saltNonce,
            address: smartAccountAddress
        })

    if (walletID === "SAFE")
        return toSafeSmartAccount({
            client: publicClient,
            owners: [owner],
            version: "1.4.1",
            entryPoint,
            saltNonce,
            address: smartAccountAddress
        })

    throw new Error(String("NOT SUPPORTED WALLET ID"));
}
