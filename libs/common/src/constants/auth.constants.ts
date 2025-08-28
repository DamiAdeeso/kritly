export const AUTH_CONSTANTS = {
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  JWT_EXPIRES_IN: '15m',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
  SALT_ROUNDS: 10,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
} as const;

export const SOCIAL_PROVIDERS = {
  GOOGLE: {
    CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
  },
  FACEBOOK: {
    CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
    CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
    CALLBACK_URL: process.env.FACEBOOK_CALLBACK_URL,
  },
  APPLE: {
    CLIENT_ID: process.env.APPLE_CLIENT_ID,
    CLIENT_SECRET: process.env.APPLE_CLIENT_SECRET,
    CALLBACK_URL: process.env.APPLE_CALLBACK_URL,
  },
  INSTAGRAM: {
    CLIENT_ID: process.env.INSTAGRAM_CLIENT_ID,
    CLIENT_SECRET: process.env.INSTAGRAM_CLIENT_SECRET,
    CALLBACK_URL: process.env.INSTAGRAM_CALLBACK_URL,
  },
} as const;

export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User already exists',
  INVALID_TOKEN: 'Invalid token',
  TOKEN_EXPIRED: 'Token expired',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  SOCIAL_LOGIN_FAILED: 'Social login failed',
  PROVIDER_NOT_SUPPORTED: 'Provider not supported',
} as const;
