FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY libs/common/package*.json ./libs/common/
COPY apps/auth-service/package*.json ./apps/auth-service/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build common library
RUN npm run build --workspace=@rev/common

# Build auth service
RUN npm run build --workspace=@rev/auth-service

# Expose port
EXPOSE 3001

# Start the service
CMD ["npm", "run", "start:prod", "--workspace=@rev/auth-service"]
