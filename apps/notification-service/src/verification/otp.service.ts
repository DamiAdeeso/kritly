import { createHash, randomInt, randomUUID } from 'crypto';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OTP_SEND_RATE_LIMIT,
  OTP_SEND_RATE_WINDOW_SECONDS,
  OtpPurpose,
  VERIFICATION_TOKEN_TTL_SECONDS,
  RedisService,
} from '@kritly/common';

interface StoredOtp {
  hash: string;
  attempts: number;
  userId?: string;
}

interface StoredVerificationToken {
  userId: string;
  purpose: string;
  subject: string;
}

@Injectable()
export class OtpService {
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  assertRedisAvailable(): void {
    if (!this.redisService.isAvailable()) {
      throw new ServiceUnavailableException('Verification service temporarily unavailable');
    }
  }

  normalizeSubject(subject: string): string {
    return subject.trim().toLowerCase();
  }

  async assertCanSend(purpose: string, subject: string): Promise<void> {
    this.assertRedisAvailable();

    const rateKey = this.rateLimitKey(purpose, subject);
    const sendCount = await this.redisService.increment(
      rateKey,
      this.configService.get<number>('verification.sendRateWindowSeconds') ??
        OTP_SEND_RATE_WINDOW_SECONDS,
    );

    const limit =
      this.configService.get<number>('verification.sendRateLimit') ?? OTP_SEND_RATE_LIMIT;

    if (sendCount > limit) {
      throw new HttpException('Too many OTP requests. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  generateCode(): string {
    const length = this.configService.get<number>('verification.codeLength') ?? 6;
    const max = 10 ** length;
    return randomInt(0, max).toString().padStart(length, '0');
  }

  async storeCode(
    purpose: string,
    subject: string,
    code: string,
    userId?: string,
  ): Promise<number> {
    const ttl = this.configService.get<number>('verification.ttlSeconds') ?? 600;
    const payload: StoredOtp = {
      hash: this.hashCode(purpose, subject, code),
      attempts: 0,
      userId,
    };

    await this.redisService.set(this.otpKey(purpose, subject), JSON.stringify(payload), ttl);
    return ttl;
  }

  async verifyCode(purpose: string, subject: string, code: string): Promise<{ userId: string }> {
    this.assertRedisAvailable();

    const key = this.otpKey(purpose, subject);
    const raw = await this.redisService.get(key);
    if (!raw) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    const stored = JSON.parse(raw) as StoredOtp;
    const maxAttempts = this.configService.get<number>('verification.maxVerifyAttempts') ?? 5;

    if (stored.attempts >= maxAttempts) {
      await this.redisService.delete(key);
      throw new HttpException('Too many invalid attempts. Request a new code.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const matches = stored.hash === this.hashCode(purpose, subject, code);
    if (!matches) {
      stored.attempts += 1;
      const ttl = this.configService.get<number>('verification.ttlSeconds') ?? 600;
      await this.redisService.set(key, JSON.stringify(stored), ttl);
      throw new BadRequestException('Invalid or expired verification code');
    }

    await this.redisService.delete(key);
    return { userId: stored.userId ?? subject };
  }

  async issueVerificationToken(input: {
    userId: string;
    purpose: string;
    subject: string;
  }): Promise<{ verificationToken: string; expiresAt: number }> {
    const verificationToken = randomUUID();
    const ttl =
      this.configService.get<number>('verification.verificationTokenTtlSeconds') ??
      VERIFICATION_TOKEN_TTL_SECONDS;
    const payload: StoredVerificationToken = {
      userId: input.userId,
      purpose: input.purpose,
      subject: input.subject,
    };

    await this.redisService.set(
      this.verificationTokenKey(verificationToken),
      JSON.stringify(payload),
      ttl,
    );

    return {
      verificationToken,
      expiresAt: Math.floor(Date.now() / 1000) + ttl,
    };
  }

  async validateVerificationToken(input: {
    verificationToken: string;
    purpose: string;
    userId?: string;
    email?: string;
  }): Promise<boolean> {
    this.assertRedisAvailable();

    const stored = await this.readVerificationToken(input.verificationToken);
    if (!stored) {
      return false;
    }

    return this.matchesVerificationToken(stored, input);
  }

  async consumeVerificationToken(input: {
    verificationToken: string;
    purpose: string;
    userId?: string;
    email?: string;
  }): Promise<boolean> {
    this.assertRedisAvailable();

    const key = this.verificationTokenKey(input.verificationToken);
    const stored = await this.readVerificationToken(input.verificationToken);
    if (!stored || !this.matchesVerificationToken(stored, input)) {
      return false;
    }

    await this.redisService.delete(key);
    return true;
  }

  formatExpiresIn(seconds: number): string {
    if (seconds >= 60) {
      return `${Math.round(seconds / 60)} minutes`;
    }

    return `${seconds} seconds`;
  }

  purposeLabel(purpose: string): string {
    switch (purpose as OtpPurpose) {
      case OtpPurpose.EMAIL_VERIFY:
        return 'email verification';
      case OtpPurpose.PASSWORD_RESET:
        return 'password reset';
      case OtpPurpose.LOGIN_2FA:
        return 'login verification';
      case OtpPurpose.SENSITIVE_ACTION:
        return 'account verification';
      default:
        return 'verification';
    }
  }

  private hashCode(purpose: string, subject: string, code: string): string {
    return createHash('sha256').update(`${purpose}:${subject}:${code}`).digest('hex');
  }

  private otpKey(purpose: string, subject: string): string {
    return `otp:${purpose}:${subject}`;
  }

  private rateLimitKey(purpose: string, subject: string): string {
    return `otp:send:${purpose}:${subject}`;
  }

  private verificationTokenKey(token: string): string {
    return `verification:token:${token}`;
  }

  private async readVerificationToken(
    verificationToken: string,
  ): Promise<StoredVerificationToken | null> {
    const raw = await this.redisService.get(this.verificationTokenKey(verificationToken));
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as StoredVerificationToken;
  }

  private matchesVerificationToken(
    stored: StoredVerificationToken,
    input: { purpose: string; userId?: string; email?: string },
  ): boolean {
    if (stored.purpose !== input.purpose) {
      return false;
    }

    const normalizedEmail = input.email?.trim().toLowerCase();
    if (normalizedEmail) {
      return stored.subject === normalizedEmail && stored.userId === normalizedEmail;
    }

    if (input.userId) {
      return stored.userId === input.userId;
    }

    return false;
  }
}
