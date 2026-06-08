# Architecture

## Backend — MVC pattern

```
src/
├── app.ts               Express app factory
├── index.ts             Server entry (connects MongoDB, starts server)
├── config/
│   ├── config.ts        Env config + SUPPORTED_WALLETS/BUNDLER/PAYMASTER
│   └── chain.ts         ALCHEMY_CHAIN_MAP (chainId → Alchemy slug)
├── controllers/         HTTP layer — parse req, call service, return res
│   ├── auth.controller.ts
│   ├── account.controller.ts
│   ├── transaction.controller.ts
│   ├── user.controller.ts
│   └── health.controller.ts
├── services/            Business logic
│   ├── auth.service.ts
│   ├── account.service.ts
│   ├── transaction.service.ts
│   └── user.service.ts
├── repositories/        MongoDB query layer
│   ├── userRepository.ts
│   ├── accountRepository.ts
│   └── transactionRepository.ts
├── models/              Mongoose schemas
│   ├── User.schema.ts
│   ├── Account.schema.ts
│   └── Transaction.schema.ts
├── middleware/
│   ├── auth.middleware.ts   requireAuth — verifies JWT, attaches userId
│   ├── errorHandler.middleware.ts
│   └── upload.middleware.ts  multer for profile image
├── scripts/             AA SDK wrappers (pure functions, no HTTP)
│   ├── permissionless.ts    getAccount / bundlerClient / paymasterClient
│   ├── alchemyApi.ts        Alchemy paymaster + UserOp lookup
│   └── pimlicoApi.ts        Pimlico gas price + UserOp status
├── types/               Shared TS types
└── utils/               logger, helpers (generateSalt, getCentralAccount, getRPC_URL)
```

## Frontend — feature-slice pattern

```
src/
├── App.tsx              Route root + provider setup
├── main.tsx             ReactDOM entry
├── components/
│   ├── auth/            LoginForm, RegisterForm, AuthenticationPage
│   ├── dashboard/       Dashboard, DashboardLayout, AccountOverview,
│   │                    TransactionHistory, UserProfile, AccountGrid, etc.
│   ├── transaction/     TransactionInterface, TransactionStatus, UserOperationStatus
│   ├── wallet/          SmartAccountStatus, WalletDashboard, WalletTypeSelector
│   ├── session/         SessionKeyManager, SessionKeyCreate, SessionKeyList
│   ├── infrastructure/  AlchemyAccountCreator, AlchemyStatusSimple
│   ├── layout/          MainLayout
│   └── ui/              Button, Card, Input, ChainSelector, etc. (design system)
├── hooks/
│   ├── useBackendSmartAccount.ts   PRIMARY hook — wraps apiClient + Redux
│   ├── useSmartAccount.ts          DEPRECATED — direct Alchemy AA (legacy)
│   ├── useSessionKeys.ts
│   ├── useTransactionHistoryBackend.ts
│   └── useUnifiedWallet.ts
├── store/
│   ├── store.ts                    Redux store + redux-persist
│   ├── smartAccountSlice.ts        Auth + account + loading state
│   ├── smartAccountObjectsSlice.ts Non-serializable AA objects (account/client)
│   ├── selectors.ts
│   └── hooks.ts                    useAppDispatch / useAppSelector
├── services/
│   └── apiClient.ts                All backend HTTP calls
├── config/
│   ├── chains.ts        SUPPORTED_CHAINS record + DEFAULT_CHAIN_ID
│   ├── bundlers.ts
│   ├── paymasters.ts
│   └── accountTypes.ts
└── types/
    ├── account.ts       SmartAccountInfo, User
    └── transaction.ts   ExecuteTransactionParams, BatchExecuteParams
```

## Data flow (transaction)

```
UI component
  → useBackendSmartAccount.sendTransaction
  → apiClient.sendTransaction (POST /api/transactions/send)
  → transaction.controller
  → transaction.service.sendTransaction
  → bundlerClient (permissionless) → Bundler RPC
  → wait for UserOperationReceipt
  → transactionRepository.createTransaction (save to MongoDB)
  → response back to UI
```
