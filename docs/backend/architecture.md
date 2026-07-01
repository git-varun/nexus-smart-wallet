# Backend Core Folder Layout

The backend codebase is written in TypeScript and runs on Node.js using Express.

## 📁 Source Code Organization
* **`src/app.ts`:** Express app instance setup and middleware assembly.
* **`src/index.ts`:** Application entry point. Integrates database, cache, and worker services.
* **`src/controllers/`:** Express controller handlers.
* **`src/services/`:** Implements core business logic.
* **`src/middleware/`:** Middlewares (auth, validation, limits).
* **`src/models/`:** Mongoose model declarations.
* **`src/repositories/`:** Database queries.
* **`src/utils/`:** Winston logging configs and system metrics.

Related Pages:
* [Business Services](services.md)
* [Mongoose Models](models.md)
