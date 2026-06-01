# Upload Service Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig*.json ./
COPY apps/upload-service/package*.json ./apps/upload-service/
COPY libs/common/package*.json ./libs/common/

RUN npm ci

COPY apps/upload-service ./apps/upload-service
COPY libs/common ./libs/common

RUN NX_DAEMON=false npx nx build common
RUN NX_DAEMON=false npx nx build upload-service

FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig*.json ./
COPY apps/upload-service/package*.json ./apps/upload-service/
COPY libs/common/package*.json ./libs/common/

RUN npm ci --omit=dev

COPY --from=builder /app/apps/upload-service/dist ./apps/upload-service/dist
COPY --from=builder /app/libs/common/dist ./libs/common/dist
COPY --from=builder /app/libs/common/src/proto ./libs/common/src/proto

RUN addgroup -g 1001 -S nodejs \
  && adduser -S nestjs -u 1001 \
  && chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3002

CMD ["node", "apps/upload-service/dist/src/main.js"]
