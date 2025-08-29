# Auth Service Dockerfile
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY nx.json ./
COPY tsconfig*.json ./
COPY apps/auth-service/package*.json ./apps/auth-service/
COPY libs/common/package*.json ./libs/common/

# Install all dependencies
RUN npm ci

# Copy source code
COPY apps/auth-service ./apps/auth-service
COPY libs/common ./libs/common

# Build the common library first
RUN cd libs/common && npm run build

# Generate Prisma client
RUN npx nx run auth-service:prisma:generate

# Build the auth service using Nx (disable daemon for Docker)
RUN NX_DAEMON=false npx nx build auth-service

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig*.json ./
COPY apps/auth-service/package*.json ./apps/auth-service/
COPY libs/common/package*.json ./libs/common/

# Install dependencies including build tools
RUN npm ci

# Copy built applications and Prisma from builder stage
COPY --from=builder /app/apps/auth-service/dist ./apps/auth-service/dist
COPY --from=builder /app/libs/common/dist ./libs/common/dist
COPY --from=builder /app/libs/common/src ./libs/common/src
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/apps/auth-service/prisma ./apps/auth-service/prisma

# Generate Prisma client in production stage
RUN npx prisma generate --schema=./apps/auth-service/prisma/schema.prisma

# Regenerate Prisma client in production stage to ensure it's properly built
RUN npx prisma generate --schema=apps/auth-service/prisma/schema.prisma

# Environment files are handled by deployment platform secrets
# No environment files are copied to production images

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership of the app directory
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose ports (gRPC and HTTP)
EXPOSE 3001 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the auth service with migrations
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./apps/auth-service/prisma/schema.prisma && node apps/auth-service/dist/apps/auth-service/src/main.js"]
