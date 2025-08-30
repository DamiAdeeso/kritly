# Gateway Service Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy only dependency manifests first
COPY package*.json nx.json tsconfig*.json ./
COPY apps/gateway/package*.json ./apps/gateway/
COPY libs/common/package*.json ./libs/common/

# Install dependencies
RUN npm ci

# Copy source code
COPY apps/gateway ./apps/gateway
COPY libs/common ./libs/common

# Build the gateway service (Nx will build dependencies like libs/common)
RUN NX_DAEMON=false npx nx build gateway

# ----------------------
# Production image
# ----------------------
FROM node:18-alpine AS production

WORKDIR /app

# Copy only package manifests
COPY package*.json nx.json tsconfig*.json ./
COPY apps/gateway/package*.json ./apps/gateway/
COPY libs/common/package*.json ./libs/common/

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built code
COPY --from=builder /app/apps/gateway/dist ./apps/gateway/dist
COPY --from=builder /app/libs/common/dist ./libs/common/dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs \
  && adduser -S nestjs -u 1001 \
  && chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3000

# Healthcheck (use wget for simplicity)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Start the gateway service
CMD ["node", "apps/gateway/dist/src/main.js"]
