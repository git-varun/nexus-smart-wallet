FROM node:20-bookworm-slim

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY src ./src
COPY tsconfig.json ./

RUN mkdir -p uploads/profile-images logs \
    && chown -R node:node /app

EXPOSE 3000

CMD ["pnpm", "dev"]
