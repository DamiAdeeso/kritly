export enum OtpPurpose {
  EMAIL_VERIFY = 'email_verify',
  PASSWORD_RESET = 'password_reset',
  LOGIN_2FA = 'login_2fa',
  SENSITIVE_ACTION = 'sensitive_action',
}

export const OTP_PURPOSES = Object.values(OtpPurpose);

export enum OtpChannel {
  EMAIL = 'email',
  SMS = 'sms',
}

export const OTP_CHANNELS = Object.values(OtpChannel);

export const VERIFICATION_METADATA_KEY = 'verificationPurpose';

export const OTP_CODE_LENGTH = 6;
export const OTP_TTL_SECONDS = 600;
export const OTP_MAX_VERIFY_ATTEMPTS = 5;
export const OTP_SEND_RATE_LIMIT = 3;
export const OTP_SEND_RATE_WINDOW_SECONDS = 900;
export const VERIFICATION_TOKEN_TTL_SECONDS = 600;
