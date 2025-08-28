# Environment Configuration Guide

## Environment Files

This project supports multiple environments with separate configuration files:

- `env.local` - Local development with watch/hot-reload
- `env.development` - Live development environment / Fly.io deployment
- `env.staging` - Staging environment
- `env.production` - Production environment

## How to Use Different Environments

### Local Development
```bash
# Uses env.local automatically (with watch/hot-reload)
npm run dev

# Or explicitly set environment
NODE_ENV=local npm run dev
```

### Live Development Environment
```bash
# Uses env.development
npm run start:dev

# Or explicitly set environment
NODE_ENV=development npm run dev
```

### Staging
```bash
# Uses env.staging
npm run start:staging

# Or explicitly set environment
NODE_ENV=staging npm run dev
```

### Production
```bash
# Uses env.production
npm run start:production

# Or explicitly set environment
NODE_ENV=production npm run dev
```

## Environment Variables by Environment

### Local (Local Development with Watch)
- **Database**: Local PostgreSQL container
- **Redis**: Local Redis container
- **JWT**: Local secret
- **Callbacks**: localhost URLs

### Development (Live Dev Environment / Fly.io)
- **Database**: Live dev PostgreSQL instance / Fly.io managed PostgreSQL
- **Redis**: Live dev Redis instance / Fly.io managed Redis
- **JWT**: Dev secret
- **Callbacks**: kritly.fly.dev URLs

### Staging
- **Database**: Staging PostgreSQL instance
- **Redis**: Staging Redis instance
- **JWT**: Staging secret (different from prod)
- **Callbacks**: staging.your-domain.com URLs

### Production
- **Database**: Production PostgreSQL instance
- **Redis**: Production Redis instance
- **JWT**: Production secret
- **Callbacks**: your-domain.com URLs



## Setting Up Fly.io Environment

### 1. Create PostgreSQL Database
```bash
flyctl postgres create --name kritly-postgres --region iad
```

### 2. Create Redis Instance
```bash
flyctl redis create --name kritly-redis --region iad
```

### 3. Attach Databases to App
```bash
flyctl postgres attach --postgres-app kritly-postgres --app kritly
flyctl redis attach --redis-app kritly-redis --app kritly
```

### 4. Set Environment Variables
```bash
# Essential variables
flyctl secrets set JWT_SECRET="your-dev-jwt-secret-key"
flyctl secrets set NODE_ENV="development"

# Social auth (optional)
flyctl secrets set GOOGLE_CLIENT_ID="your-google-client-id"
flyctl secrets set GOOGLE_CLIENT_SECRET="your-google-client-secret"
flyctl secrets set FACEBOOK_CLIENT_ID="your-facebook-client-id"
flyctl secrets set FACEBOOK_CLIENT_SECRET="your-facebook-client-secret"
```

### 5. Deploy
```bash
flyctl deploy
```

## Environment Variable Priority

The application loads environment variables in this order:
1. System environment variables
2. `.env.{NODE_ENV}` file (e.g., `.env.development`)
3. `.env` file (fallback)

## Security Notes

- **Never commit real secrets** to version control
- **Use different secrets** for each environment
- **Use strong JWT secrets** in production
- **Enable TLS** for Redis in production/staging
- **Use managed databases** in production

## Quick Environment Switch

### Local Development
```bash
cp env.local .env
npm run dev
```

### Live Development Environment
```bash
cp env.development .env
npm run start:dev
```

### Staging
```bash
cp env.staging .env
npm run start:staging
```

### Production
```bash
cp env.production .env
npm run start:production
```

### Fly.io
```bash
# Use env.development as reference, but set secrets via flyctl
flyctl secrets import env.development
```
