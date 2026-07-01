# Frontend User Flows

Critical user journeys implemented in the frontend.

## 1. User Onboarding Flow
1. User enters email, username, and password on `/settings` or registration view.
2. React client submits data to `POST /api/auth/register`.
3. Client stores returned JWT token in the Redux store.
4. Client requests a Predicted Smart Account via `POST /api/accounts/create`.
5. Counterfactual address is cached, and client transitions to Home dashboard.

## 2. Transfer Submission Flow
1. User clicks the "Transfer" button and enters a destination address, value, and select chain.
2. Client queries `POST /api/transactions/estimate_gas` to retrieve gas limit options.
3. User confirms the transaction.
4. Client submits parameters to `POST /api/transactions/send` and displays a pending toast.
5. The dashboard listens to SSE notifications. When `transaction.confirmed` is received, the toast updates to success, and the transaction list refetches.

Related Pages:
* [Pages Directory](pages.md)
* [Router Config](routing.md)
