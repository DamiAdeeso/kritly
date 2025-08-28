# Deployment Guide

## Environment Variables

### Database Configuration
```env
DATABASE_URL=postgresql://username:password@host:port/database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=rev_db
```

### Redis Configuration
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_URL=redis://localhost:6379
REDIS_TLS=false
```

### JWT Configuration
```env
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=15m
```

### Service Configuration
```env
NODE_ENV=production
AUTH_SERVICE_HOST=localhost
AUTH_SERVICE_PORT=3001
HTTP_PORT=3002
```

### Social Auth Configuration
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-domain.com/auth/google/callback

FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
FACEBOOK_CALLBACK_URL=https://your-domain.com/auth/facebook/callback

APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_PRIVATE_KEY=your-apple-private-key
APPLE_CALLBACK_URL=https://your-domain.com/auth/apple/callback

INSTAGRAM_CLIENT_ID=your-instagram-client-id
INSTAGRAM_CLIENT_SECRET=your-instagram-client-secret
INSTAGRAM_CALLBACK_URL=https://your-domain.com/auth/instagram/callback
```

## Deployment Platform

### Fly.io (Recommended)
1. **Install Fly CLI**: 
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```
2. **Login to Fly.io**:
   ```bash
   fly auth login
   ```
3. **Launch the app**:
   ```bash
   fly launch
   ```
4. **Create PostgreSQL database**:
   ```bash
   fly postgres create --name rev-postgres --region iad
   ```
5. **Create Redis instance**:
   ```bash
   fly redis create --name rev-redis --region iad
   ```
6. **Attach databases to app**:
   ```bash
   fly postgres attach --postgres-app rev-postgres --app rev-microservices
   fly redis attach --redis-app rev-redis --app rev-microservices
   ```
7. **Set environment variables**:
   ```bash
   fly secrets set JWT_SECRET="your-super-secret-jwt-key-here"
   fly secrets set NODE_ENV="production"
   ```
8. **Deploy**:
   ```bash
   fly deploy
   ```

## Database Setup

### Local Development
```bash
# Start PostgreSQL and Redis with Docker
docker-compose up -d postgres redis

# Run migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate
```

### Production
1. Create managed PostgreSQL database
2. Get connection string
3. Set `DATABASE_URL` environment variable
4. Run migrations: `npm run db:migrate:deploy`

## Health Checks

Both services have health check endpoints:
- Auth Service: `GET /health`
- Gateway: `GET /health`

## Monitoring

### Fly.io Commands
```bash
# View logs
fly logs

# Check app status
fly status

# Monitor resources
fly dashboard

# SSH into app (if needed)
fly ssh console
```
