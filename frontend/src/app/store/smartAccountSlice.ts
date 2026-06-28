import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {User} from '@/types/account';
import {SmartWallet} from '@/entities/wallet/model/adapter';

interface SmartAccountState {
    // Auth state
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;

    // Core smart account data
    smartAccountAddress: string;
    smartAccountInfo: SmartWallet | null;
    userAccounts: SmartWallet[];
    currentChainId: number;

    // Creation state
    isCreatingAccount: boolean;
    creationError: string | null;

    // Transaction state
    isExecuting: boolean;

    // Loading states
    isLoading: boolean;

    // Guardian management
    newGuardian: string;
    guardianError: string;

    // These can't be serialized, so we'll handle them separately
    // smartAccount: any | null;
    // smartAccountClient: any | null;
}

const initialState: SmartAccountState = {
    isAuthenticated: false,
    user: null,
    token: null,
    smartAccountAddress: '',
    smartAccountInfo: null,
    userAccounts: [],
    currentChainId: 84532, // Default to Base Sepolia
    isCreatingAccount: false,
    creationError: null,
    isExecuting: false,
    isLoading: false,
    newGuardian: '',
    guardianError: '',
};

const smartAccountSlice = createSlice({
    name: 'smartAccount',
    initialState,
    reducers: {
        // Auth management
        setAuthData: (state, action: PayloadAction<{ user: User; token: string }>) => {
            state.isAuthenticated = true;
            state.user = action.payload.user;
            state.token = action.payload.token;
        },

        clearAuthData: (state) => {
            state.isAuthenticated = false;
            state.user = null;
            state.token = null;
            state.smartAccountAddress = '';
            state.smartAccountInfo = null;
            state.userAccounts = [];
        },

        // Smart account management
        setSmartAccountAddress: (state, action: PayloadAction<string>) => {
            state.smartAccountAddress = action.payload;
        },

        setSmartAccountInfo: (state, action: PayloadAction<SmartWallet | null>) => {
            state.smartAccountInfo = action.payload;
            if (action.payload) {
                state.smartAccountAddress = action.payload.address;
            }
        },

        setUserAccounts: (state, action: PayloadAction<SmartWallet[]>) => {
            state.userAccounts = action.payload;
        },

        setCurrentChainId: (state, action: PayloadAction<number>) => {
            state.currentChainId = action.payload;
        },

        // Creation state management
        setIsCreatingAccount: (state, action: PayloadAction<boolean>) => {
            state.isCreatingAccount = action.payload;
            if (action.payload) {
                state.creationError = null; // Clear error when starting
            }
        },

        setCreationError: (state, action: PayloadAction<string | null>) => {
            state.creationError = action.payload;
            if (action.payload) {
                state.isCreatingAccount = false; // Stop creation on error
            }
        },

        // Transaction state
        setIsExecuting: (state, action: PayloadAction<boolean>) => {
            state.isExecuting = action.payload;
        },

        // Loading state
        setIsLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },

        // Guardian management
        setNewGuardian: (state, action: PayloadAction<string>) => {
            state.newGuardian = action.payload;
            state.guardianError = ''; // Clear error when typing
        },

        setGuardianError: (state, action: PayloadAction<string>) => {
            state.guardianError = action.payload;
        },

        // Reset all state (useful for wallet disconnection)
        resetSmartAccountState: () => initialState,

        // Complete smart account setup (called after successful creation)
        completeAccountCreation: (state, action: PayloadAction<{ address: string; info?: SmartWallet }>) => {
            state.smartAccountAddress = action.payload.address;
            state.smartAccountInfo = action.payload.info || null;
            state.isCreatingAccount = false;
            state.creationError = null;
        },
    },
});

export const {
    setAuthData,
    clearAuthData,
    setSmartAccountAddress,
    setSmartAccountInfo,
    setUserAccounts,
    setCurrentChainId,
    setIsCreatingAccount,
    setCreationError,
    setIsExecuting,
    setIsLoading,
    setNewGuardian,
    setGuardianError,
    resetSmartAccountState,
    completeAccountCreation,
} = smartAccountSlice.actions;

export default smartAccountSlice.reducer;
