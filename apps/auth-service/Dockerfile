# Auth Service Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json nx.json tsconfig*.json project.json ./
COPY apps/auth-service/package*.json ./apps/auth-service/
COPY libs/common/package*.json ./libs/common/
COPY libs/database/package*.json ./libs/database/

RUN npm ci

COPY apps/auth-service ./apps/auth-service
COPY libs/common ./libs/common
COPY libs/database ./libs/database
COPY prisma ./prisma
COPY scripts/prisma-cli.cjs ./scripts/prisma-cli.cjs

RUN NX_DAEMON=false npx nx run database:prisma:generate
RUN NX_DAEMON=false npx nx build common
RUN NX_DAEMON=false npx nx build auth-service

FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json nx.json tsconfig*.json ./
COPY apps/auth-service/package*.json ./apps/auth-service/
COPY libs/common/package*.json ./libs/common/

RUN npm ci --omit=dev

COPY --from=builder /app/apps/auth-service/dist ./apps/auth-service/dist
COPY --from=builder /app/libs/common/dist ./libs/common/dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/libs/common/src/proto ./libs/common/src/proto
COPY apps/auth-service/scripts/grpc-health-check.js ./apps/auth-service/scripts/grpc-health-check.js

RUN addgroup -g 1001 -S nodejs \
  && adduser -S nestjs -u 1001 \
  && chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node apps/auth-service/scripts/grpc-health-check.js || exit 1

CMD ["node", "apps/auth-service/dist/src/main.js"]
