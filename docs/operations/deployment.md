# Production Deployment Guide

Deployments utilize Docker Compose to manage dependencies and scale instances.

## 🚀 Rolling Update Deployment
To update the backend with zero downtime:
1. Build and tag backend container images:
   ```bash
   docker build -t registry/nexus-backend:v1.0.0 ./backend
   ```
2. Pull the latest image:
   ```bash
   docker compose pull backend
   ```
3. Scale the backend to run multiple containers:
   ```bash
   docker compose up -d --no-deps --scale backend=2 backend
   ```
4. Nginx automatically prunes old containers and routes traffic to the active instances.

Related Pages:
* [Docker Topologies](docker.md)
* [Operational Runbook](runbook.md)
