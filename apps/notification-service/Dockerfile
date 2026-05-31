# Notification Service Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig*.json ./
COPY apps/notification-service/package*.json ./apps/notification-service/
COPY libs/common/package*.json ./libs/common/

RUN npm ci

COPY apps/notification-service ./apps/notification-service
COPY libs/common ./libs/common

COPY prisma ./prisma
COPY scripts/prisma-cli.cjs ./scripts/prisma-cli.cjs
COPY libs/database ./libs/database

RUN NX_DAEMON=false npx nx run database:prisma:generate
RUN NX_DAEMON=false npx nx build common
RUN NX_DAEMON=false npx nx build notification-service

FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig*.json ./
COPY apps/notification-service/package*.json ./apps/notification-service/
COPY libs/common/package*.json ./libs/common/

RUN npm ci --omit=dev

COPY --from=builder /app/apps/notification-service/dist ./apps/notification-service/dist
COPY --from=builder /app/libs/common/dist ./libs/common/dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

RUN addgroup -g 1001 -S nodejs \
  && adduser -S nestjs -u 1001 \
  && chown -R nestjs:nodejs /app
USER nestjs

CMD ["node", "apps/notification-service/dist/main.js"]
