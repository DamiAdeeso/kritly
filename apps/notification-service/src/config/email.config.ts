import { registerAs } from '@nestjs/config';
import { DEFAULT_MAILTRAP_API_URL, EMAIL_PROVIDERS, EmailProviderName } from './email.constants';

function resolveEmailProvider(): EmailProviderName {
  const raw = (process.env.EMAIL_PROVIDER || 'smtp').toLowerCase();
  if ((EMAIL_PROVIDERS as readonly string[]).includes(raw)) {
    return raw as EmailProviderName;
  }

  return 'smtp';
}

export default registerAs('email', () => ({
  provider: resolveEmailProvider(),
  from: process.env.EMAIL_FROM || process.env.SMTP_FROM || 'Kritly <noreply@kritly.com>',
  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || undefined,
    pass: process.env.SMTP_PASS || undefined,
    secure: process.env.SMTP_SECURE === 'true',
  },
  mailtrap: {
    apiToken: process.env.MAILTRAP_API_TOKEN || undefined,
    apiUrl: process.env.MAILTRAP_API_URL || DEFAULT_MAILTRAP_API_URL,
  },
  ses: {
    region: process.env.SES_REGION || process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.SES_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || undefined,
    secretAccessKey:
      process.env.SES_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || undefined,
  },
}));
