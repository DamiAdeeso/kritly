import { registerAs } from '@nestjs/config';
import {
  OTP_CODE_LENGTH,
  OTP_MAX_VERIFY_ATTEMPTS,
  OTP_SEND_RATE_LIMIT,
  OTP_SEND_RATE_WINDOW_SECONDS,
  OTP_TTL_SECONDS,
  VERIFICATION_TOKEN_TTL_SECONDS,
} from '@kritly/common';

export default registerAs('verification', () => ({
  codeLength: Number(process.env.OTP_CODE_LENGTH || OTP_CODE_LENGTH),
  ttlSeconds: Number(process.env.OTP_TTL_SECONDS || OTP_TTL_SECONDS),
  maxVerifyAttempts: Number(process.env.OTP_MAX_VERIFY_ATTEMPTS || OTP_MAX_VERIFY_ATTEMPTS),
  sendRateLimit: Number(process.env.OTP_SEND_RATE_LIMIT || OTP_SEND_RATE_LIMIT),
  sendRateWindowSeconds: Number(
    process.env.OTP_SEND_RATE_WINDOW_SECONDS || OTP_SEND_RATE_WINDOW_SECONDS,
  ),
  verificationTokenTtlSeconds: Number(
    process.env.VERIFICATION_TOKEN_TTL_SECONDS || VERIFICATION_TOKEN_TTL_SECONDS,
  ),
}));
