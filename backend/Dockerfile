# Stage 1: Build
FROM node:22.13-alpine AS builder

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable

# Copy package config and lockfile for deterministic install
COPY package.json pnpm-lock.yaml tsconfig.json ./
RUN COREPACK_INTEGRITY_KEYS=0 pnpm install --frozen-lockfile

COPY src ./src
RUN pnpm run build

# Stage 2: Production Runtime
FROM node:22.13-alpine AS runner

WORKDIR /app

RUN corepack enable

# Copy package config and lockfile
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies with frozen lockfile
RUN COREPACK_INTEGRITY_KEYS=0 pnpm install --frozen-lockfile --prod

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

# Copy startup script and install su-exec for privilege drop
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh && apk add --no-cache su-exec

# Ensure runtime dirs exist (will be chowned at container start)
RUN mkdir -p uploads/profile-images logs

# Entrypoint handles ownership of mounted folders and drops privileges
ENTRYPOINT ["/app/docker-entrypoint.sh"]

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

# Health check endpoint validation using native fetch
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3001/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"
