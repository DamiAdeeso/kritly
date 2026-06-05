export const EMAIL_PROVIDERS = ['smtp', 'mailtrap', 'ses'] as const;

export type EmailProviderName = (typeof EMAIL_PROVIDERS)[number];

export const DEFAULT_MAILTRAP_API_URL = 'https://send.api.mailtrap.io/api/send';
