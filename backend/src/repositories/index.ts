// Import all repository functions
import * as userRepo from './userRepository';
import * as accountRepo from './accountRepository';
import * as transactionRepo from './transactionRepository';
import * as sessionKeyRepo from './sessionKeyRepository';

// Re-export repository modules with consistent naming
export const userRepository = userRepo;
export const accountRepository = accountRepo;
export const transactionRepository = transactionRepo;
export const sessionKeyRepository = sessionKeyRepo;

