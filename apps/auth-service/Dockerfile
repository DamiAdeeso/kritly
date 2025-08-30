# ================================
# 1. Builder Stage
# ================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build tools (needed for some packages)
RUN apk add --no-cache python3 make g++

# Copy only package files for caching dependencies
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Install dependencies (prefer pnpm if available, else npm)
RUN if [ -f pnpm-lock.yaml ]; then \
      npm install -g pnpm && pnpm install --frozen-lockfile; \
    elif [ -f yarn.lock ]; then \
      npm install -g yarn && yarn install --frozen-lockfile; \
    else \
      npm ci; \
    fi

# Copy the full monorepo into container
COPY . .

# Build the target app (pass target via build arg)
ARG APP_NAME
RUN npx nx build $APP_NAME

# ================================
# 2. Runtime Stage
# ================================
FROM node:20-alpine AS runner

WORKDIR /app

# Copy only built app and needed files from builder
COPY --from=builder /app/dist/apps/${APP_NAME} ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Environment defaults
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start command
CMD ["node", "dist/main.js"]
