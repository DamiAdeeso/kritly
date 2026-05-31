import { registerAs } from '@nestjs/config';

export default registerAs('notification', () => ({
  appUrl: process.env.NOTIFICATION_APP_URL || 'https://kritly.com',
  supportEmail: process.env.NOTIFICATION_SUPPORT_EMAIL || 'support@kritly.com',
  templateCacheTtlSeconds: parseInt(process.env.NOTIFICATION_TEMPLATE_CACHE_TTL || '1800', 10),
}));
