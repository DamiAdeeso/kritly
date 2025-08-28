FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY libs/common/package*.json ./libs/common/
COPY apps/gateway/package*.json ./apps/gateway/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build common library
RUN npm run build --workspace=@rev/common

# Build gateway service
RUN npm run build --workspace=@rev/gateway

# Expose port
EXPOSE 3000

# Start the service
CMD ["npm", "run", "start:prod", "--workspace=@rev/gateway"]
