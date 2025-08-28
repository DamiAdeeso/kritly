# Rev Microservices Platform

A modern microservices architecture built with NestJS and Nx, featuring authentication with multiple social providers and a comprehensive API gateway.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │  Auth Service   │
│   (Next.js)     │◄──►│   (Port 3000)   │◄──►│  (Port 3001)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Common Lib    │    │   PostgreSQL    │
                       │   (Shared)      │    │   Database      │
                       └─────────────────┘    └─────────────────┘
```

## 🚀 Features

### Authentication Service
- **Email/Password Authentication**: Traditional login and registration
- **Social Authentication**: 
  - Google OAuth 2.0
  - Facebook OAuth 2.0
  - Apple Sign-In
  - Instagram Basic Display API
- **JWT Token Management**: Access and refresh tokens
- **Repository Pattern**: Clean data access layer with Prisma ORM
- **Comprehensive Validation**: Input validation and sanitization

### API Gateway
- **Request Routing**: Routes requests to appropriate microservices
- **Load Balancing**: Distributes traffic across services
- **API Documentation**: Swagger/OpenAPI documentation
- **Health Checks**: Service health monitoring

### Common Library
- **Shared DTOs**: Common data transfer objects
- **Interfaces**: Shared type definitions
- **Enums**: Common enumerations
- **Utilities**: Validation and helper functions

### Nx Monorepo Features
- **Intelligent Caching**: Only rebuilds what changed
- **Parallel Execution**: Runs tasks across workspaces efficiently
- **Dependency Graph**: Automatically determines build order
- **Affected Commands**: Only runs on changed projects
- **Rich CLI**: Advanced development tooling

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rev
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb rev_auth_db
   
   # Generate Prisma client
   npm run db:generate
   
   # Run migrations
   npm run db:migrate
   ```

5. **Start the services**
   ```bash
   # Start all services in parallel
   npm run dev
   
   # Or start individually
   npm run dev:gateway    # Gateway on port 3000
   npm run dev:auth       # Auth service on port 3001
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/rev_auth_db"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Service Ports
PORT=3000
AUTH_SERVICE_PORT=3001

# Social Authentication
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
APPLE_CLIENT_ID=your-apple-client-id
APPLE_CLIENT_SECRET=your-apple-client-secret
INSTAGRAM_CLIENT_ID=your-instagram-client-id
INSTAGRAM_CLIENT_SECRET=your-instagram-client-secret
```

### Social Authentication Setup

#### Google OAuth 2.0
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs

#### Facebook OAuth 2.0
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth settings

#### Apple Sign-In
1. Go to [Apple Developer](https://developer.apple.com/)
2. Create an App ID
3. Enable Sign In with Apple
4. Create a Service ID

#### Instagram Basic Display
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Instagram Basic Display product
4. Configure OAuth settings

## 📚 API Documentation

### Gateway Endpoints

All API requests should be made to the Gateway service (port 3000):

#### Authentication Endpoints

**Register User**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Social Login**
```http
POST /api/auth/social-login
Content-Type: application/json

{
  "provider": "google",
  "accessToken": "google-access-token"
}
```

**Refresh Token**
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh-token"
}
```

**Logout**
```http
POST /api/auth/logout
Content-Type: application/json

{
  "refreshToken": "refresh-token"
}
```

**Validate Token**
```http
GET /api/auth/validate
Authorization: Bearer <access-token>
```

**Health Check**
```http
GET /api/health
```

### Response Format

All endpoints return consistent response formats:

```json
{
  "message": "Success message",
  "data": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "userId": "user-id",
    "email": "user@example.com"
  },
  "statusCode": 200
}
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  avatar VARCHAR(500),
  password VARCHAR(255),
  role USER_ROLE DEFAULT 'USER',
  status USER_STATUS DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Social Accounts Table
```sql
CREATE TABLE social_accounts (
  id VARCHAR(255) PRIMARY KEY,
  provider AUTH_PROVIDER NOT NULL,
  provider_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, provider_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Refresh Tokens Table
```sql
CREATE TABLE refresh_tokens (
  id VARCHAR(255) PRIMARY KEY,
  token VARCHAR(500) UNIQUE NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e

# Run tests on affected projects only
npm run affected:test
```

## 📦 Available Scripts

### Development
```bash
npm run dev              # Start all services in parallel
npm run dev:gateway      # Start gateway only
npm run dev:auth         # Start auth service only
```

### Building
```bash
npm run build            # Build all projects
npm run affected:build   # Build only affected projects
npx nx build auth-service  # Build auth service only
npx nx build gateway     # Build gateway only
npx nx build common      # Build common library only
```

### Database
```bash
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run database migrations
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Run database seeding
```

### Testing
```bash
npm test                 # Run all tests
npm run affected:test    # Run tests on affected projects
npx nx test auth-service # Test auth service only
npx nx test gateway      # Test gateway only
npx nx test common       # Test common library only
```

### Linting & Formatting
```bash
npm run lint             # Run ESLint
npm run affected:lint    # Lint affected projects
npx nx lint auth-service # Lint auth service only
npx nx lint gateway      # Lint gateway only
npx nx lint common       # Lint common library only
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
```

### Nx Commands
```bash
npm run graph            # View dependency graph
npm run clean            # Clear Nx cache
npm run generate         # Generate new code
npx nx show projects     # List all projects
npx nx show project auth-service  # Show auth service details
```

## 🔒 Security Features

- **JWT Token Management**: Secure token generation and validation
- **Password Hashing**: bcrypt with configurable salt rounds
- **Input Validation**: Comprehensive validation using class-validator
- **CORS Protection**: Configurable CORS settings
- **Rate Limiting**: Built-in rate limiting (can be extended)
- **SQL Injection Protection**: Prisma ORM with parameterized queries

## 🚀 Deployment

### Docker Deployment

```dockerfile
# Example Dockerfile for production
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000 3001

CMD ["npm", "run", "start:prod"]
```

### Environment Variables for Production

```env
NODE_ENV=production
DATABASE_URL=your-production-database-url
JWT_SECRET=your-production-jwt-secret
ALLOWED_ORIGINS=https://yourdomain.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@rev.com or create an issue in the repository.

## 🔄 Version History

- **v1.0.0** - Initial release with authentication and gateway services
- **v1.1.0** - Added social authentication providers
- **v1.2.0** - Enhanced security features and documentation
- **v2.0.0** - Migrated to Nx for improved development experience
