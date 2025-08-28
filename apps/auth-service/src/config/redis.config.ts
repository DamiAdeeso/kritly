import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  url: process.env.REDIS_URL || undefined,
  tls: process.env.NODE_ENV === 'production' && process.env.REDIS_TLS === 'true' ? {} : undefined,
}));
