# Gateway Service Dockerfile
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY nx.json ./
COPY tsconfig*.json ./
COPY apps/gateway/package*.json ./apps/gateway/
COPY libs/common/package*.json ./libs/common/

# Install all dependencies
RUN npm ci

# Copy source code
COPY apps/gateway ./apps/gateway
COPY libs/common ./libs/common

# Build the common library first
RUN cd libs/common && npm run build

# Build the gateway service using Nx (disable daemon for Docker)
RUN NX_DAEMON=false npx nx build gateway

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig*.json ./
COPY apps/gateway/package*.json ./apps/gateway/
COPY libs/common/package*.json ./libs/common/

# Install dependencies including build tools
RUN npm ci

# Copy built applications from builder stage
COPY --from=builder /app/apps/gateway/dist ./apps/gateway/dist
COPY --from=builder /app/libs/common/dist ./libs/common/dist
COPY --from=builder /app/libs/common/src ./libs/common/src

# Environment files are handled by deployment platform secrets
# No environment files are copied to production images

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership of the app directory
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the gateway service
CMD ["node", "apps/gateway/dist/src/main.js"]
