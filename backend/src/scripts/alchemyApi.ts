import {config} from '../config/config';
import {Address, hexToString, toHex} from "viem";
import {createServiceLogger, getRPC_URL} from "../utils";
import {entryPoint07Address} from "viem/account-abstraction";

const logger = createServiceLogger("Bundler");
const TIMEOUT = 10000;

const makeBundlerRequest = async <T>(
    method: string,
    params: any[]
): Promise<T> => {
    const baseUrl = `https://base-sepolia.g.alchemy.com/v2/${config.alchemy.apiKey}`;

    const requestBody = {
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params
    };

    logger.info(`Making ${method} request`, params);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    try {
        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: any = await response.json();

        if (data.error) {
            throw new Error(`Bundler API Error: ${data.error.message}`);
        }

        return data.result;
    } catch (error) {
        clearTimeout(timeoutId);
        logger.error(`${method} failed`, error instanceof Error ? error : new Error(String(error)));
        throw error;
    }
};

/**
 * Send UserOperation to the bundler
 */
export const sendUserOperation = async (
    userOp: any
) => {
    try {
        const entryPoint = entryPoint07Address;
        logger.debug('Sending UserOperation', { sender: userOp.sender });

        const userOpHash = await makeBundlerRequest<string>(
            'eth_sendUserOperation',
            [userOp, entryPoint]
        );

        return {
            userOpHash: userOpHash as `0x${string}`,
            success: true
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            userOpHash: '0x' as `0x${string}`,
            success: false,
            error: errorMessage
        };
    }
};

export const getUserOperationByHash = async (
    userOpHash: string
) => {
    logger.debug('Getting UserOperation by hash', { userOpHash });
    return await makeBundlerRequest(
        'eth_getUserOperationByHash',
        [userOpHash]
    );
};

export const getUserOperationReceipt = async (
    userOpHash: string
) => {
    logger.debug('Getting UserOperation receipt', { userOpHash });
    return await makeBundlerRequest(
        'eth_getUserOperationReceipt',
        [userOpHash]
    );
};

export const estimateUserOperationGas = async (
    userOp: any,
) => {
    const entryPoint = entryPoint07Address;
    return await makeBundlerRequest(
        'eth_estimateUserOperationGas',
        [userOp, entryPoint]
    );
};

export const simulateUserOperation = async (
    userOp: any
) => {
    const entryPoint = entryPoint07Address
    logger.debug('Simulating UserOperation', { sender: userOp.sender });

    return await makeBundlerRequest(
        'eth_simulateUserOperation',
        [userOp, entryPoint]
    );
};

export const rundler_maxPriorityFeePerGas = async () => {
    return await makeBundlerRequest('rundler_maxPriorityFeePerGas', []);
};

/**
 * Simple Gas Manager API request - no retry logic for POC
 */
const makeGasManagerRequest = async <T>(
    method: string,
    params: any[]
): Promise<T> => {
    const baseUrl = getRPC_URL(hexToString(params[2]), "ALCHEMY");

    const requestBody = {
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params
    };

    logger.debug(`Making Gas Manager ${method} request`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    function bigIntReplacer(key: string, value: any) {
        if (typeof value === 'bigint') {
            // Convert BigInt to a hex string with the '0x' prefix
            return `0x${value.toString(16)}`;
        }
        return value;
    }

    try {
        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody, bigIntReplacer),
            signal: controller.signal
        });


        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: any = await response.json();

        if (data.error) {
            logger.error('Gas Manager API error response', undefined, data.error);
            throw new Error(`Gas Manager API Error: ${data.error.message}`);
        }

        return data.result;
    } catch (error) {
        clearTimeout(timeoutId);
        logger.error(`Gas Manager ${method} failed`, error instanceof Error ? error : new Error(String(error)));
        throw error;
    }
};


export const requestGasAndPaymasterData = async (
    userOp: any
) => {
    logger.debug('Requesting gas and paymaster data', { sender: userOp.sender });
    const params: any = {userOp};
    if (config.alchemy.policyId) {
        params.policyId = config.alchemy.policyId;
    }

    return await makeGasManagerRequest(
        'alchemy_requestGasAndPaymasterAndData',
        [params]
    );
};

export const sponsorUserOperation = async (
    userOp: any
) => {
    logger.debug('Sponsoring UserOperation', { sender: userOp.sender });
    const params: any = {
        userOp,
        sponsorshipType: 'full'
    };

    if (config.alchemy.policyId) {
        params.policyId = config.alchemy.policyId;
    }

    return await makeGasManagerRequest(
        'alchemy_sponsorUserOperation',
        [params]
    );
};

export const getPaymasterOptions = async (
    userOp: any
) => {
    logger.debug('Getting paymaster options', { sender: userOp.sender });
    return await makeGasManagerRequest(
        'alchemy_getPaymasterOptions',
        [{userOp}]
    );
};

export const estimateGasCost = async (
    userOp: any
) => {
    logger.debug('Estimating gas cost', { sender: userOp.sender });
    return await makeGasManagerRequest(
        'alchemy_estimateGasCost',
        [{userOp}]
    );
};

export const getAlchemyPaymasterStubData = async (
    userOp: any, entryPointAddress: Address, chainId: string | number
) => {
    logger.debug('Getting alchemyPaymasterStubData', { userOp });
    userOp = {
        ...userOp,
        maxFeePerGas: toHex(userOp.maxFeePerGas) as string,
        maxPriorityFeePerGas: toHex(userOp.maxPriorityFeePerGas) as string,
        nonce: toHex(userOp.nonce) as string,
        callGasLimit: toHex(userOp.callGasLimit) as string,
        verificationGasLimit: toHex(userOp.verificationGasLimit) as string,
        preVerificationGas: toHex(userOp.preVerificationGas) as string,
    }
    const params: any = [userOp, entryPointAddress, toHex(chainId), {policyId: config.alchemy.policyId}];
    logger.debug('Getting paymaster stub data', { params });
    return await makeGasManagerRequest(
        'pm_getPaymasterStubData',
        params
    );
};
