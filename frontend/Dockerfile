# Stage 1: Build
FROM node:22.13-alpine AS builder

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable

# Copy package config and lockfile for deterministic install
COPY package.json pnpm-lock.yaml tsconfig.json tsconfig.node.json tsconfig.app.json tailwind.config.js postcss.config.js ./
RUN COREPACK_INTEGRITY_KEYS=0 pnpm install --frozen-lockfile

# Copy source files
COPY src ./src
COPY public ./public
COPY vite.config.ts index.html ./
RUN pnpm run build

# Stage 2: Production Server
FROM nginx:1.25-alpine AS runner

# Copy custom Nginx configuration for SPA routing support
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts to Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
