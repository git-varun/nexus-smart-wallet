import { test, expect } from '@playwright/test';
import {
    userDto,
    smartAccountDto,
    portfolioDto,
    sessionKeyDto
} from './src/shared/api/contracts';
import {
    parseNotificationEvent
} from './src/shared/api/notification';

test.describe('API Contract Validations (Unit Tests)', () => {
    test('userDto validates correctly', () => {
        const validUser = {
            id: '123',
            email: 'test@example.com',
            createdAt: new Date().toISOString()
        };
        // The validator expects { user: UserDto } under the path
        expect(() => userDto(validUser, 'user')).not.toThrow();
    });

    test('smartAccountDto validates correctly', () => {
        const validAccount = {
            id: '1',
            userId: '1',
            address: '0x123',
            chainId: 1,
            isDeployed: true,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        // It validates the raw DTO
        expect(() => smartAccountDto(validAccount, 'account')).not.toThrow();
        
        // Ensure it throws on malformed data
        expect(() => smartAccountDto({ ...validAccount, isDeployed: 'yes' }, 'account')).toThrow();
    });

    test('portfolioDto validates correctly', () => {
        const validPortfolio = {
            id: '1',
            userId: '1',
            address: '0x123',
            chainId: 1,
            assets: [
                {
                    type: 'native',
                    balance: '1000000000000000000'
                }
            ],
            lastSyncedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        expect(() => portfolioDto(validPortfolio, 'portfolio')).not.toThrow();
    });

    test('sessionKeyDto validates correctly', () => {
        const validSessionKey = {
            id: '1',
            userId: '1',
            ownerAddress: '0x123',
            publicKey: '0xabc',
            chainId: 1,
            permissions: [],
            expiresAt: new Date().toISOString(),
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        expect(() => sessionKeyDto(validSessionKey, 'data')).not.toThrow();
    });

    test('notification parser enforces explicit shapes', () => {
        const validEvent = {
            id: 'evt_1',
            type: 'transaction.confirmed',
            timestamp: new Date().toISOString(),
            payload: {
                transactionId: 'tx_1',
                accountId: 'acc_1',
                hash: '0xabc'
            }
        };
        
        expect(() => parseNotificationEvent(validEvent)).not.toThrow();
        
        const invalidEvent = {
            type: 'transaction.confirmed',
            payload: {
                transactionId: 'tx_1'
                // missing accountId and hash
            }
        };
        expect(() => parseNotificationEvent(invalidEvent)).toThrow();
    });
});
