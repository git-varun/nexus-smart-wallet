# Docker Topologies

Dockerfiles configuration for backend and frontend.

## ⚙️ Backend Dockerfile (`backend/Dockerfile`)
* Uses a multi-stage build.
* **Stage 1 (Build):** Compiles TypeScript into JS under `dist/`.
* **Stage 2 (Production):** Installs production dependencies and runs as a non-root node user.

## ⚙️ Frontend Dockerfile (`frontend/Dockerfile`)
* **Stage 1 (Build):** Compiles static assets using Vite.
* **Stage 2 (Deploy):** Serves the compiled files using Nginx.

Related Pages:
* [Deployment Guide](deployment.md)
* [Configs Manifest](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/reference/configuration.md)
