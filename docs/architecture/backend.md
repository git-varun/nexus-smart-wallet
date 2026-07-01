# Backend Architecture

The backend is built as a modular Express server, written in TypeScript and backed by MongoDB (via Mongoose) and Redis.

## 📁 Directory Structure
* **`src/controllers/`:** Maps requests, parses input data via Zod, and returns HTTP responses.
* **`src/services/`:** Implements core business logic (auth validations, Viem operations, signing).
* **`src/middleware/`:** Enforces authentication, request logging, upload controls, and route rate limits.
* **`src/models/`:** Contains Mongoose schemas and compound indexes.
* **`src/repositories/`:** Isolates database queries from services.

## 🔄 App Setup Sequence
At startup, `src/index.ts` initializes external dependencies sequentially:
1. Connects to **MongoDB** (validating replica sets for transactions).
2. Connects to **Redis** (establishing rates and event listeners).
3. Initializes the **Notification Service** (SSE listener + Redis subscriber).
4. Launches the Express server and boots the **Background Queue Worker** loops.

Related Pages:
* [Backend Services](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/backend/services.md)
* [Mongoose Models](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/backend/models.md)
