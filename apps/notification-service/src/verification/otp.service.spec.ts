import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OtpPurpose } from '@kritly/common';
import { OtpService } from './otp.service';

describe('OtpService', () => {
  let service: OtpService;
  let redisStore: Map<string, string>;
  let redisAvailable: boolean;
  let configService: ConfigService;

  beforeEach(() => {
    redisStore = new Map();
    redisAvailable = true;

    configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, unknown> = {
          'verification.codeLength': 6,
          'verification.ttlSeconds': 600,
          'verification.maxVerifyAttempts': 5,
          'verification.sendRateLimit': 3,
          'verification.sendRateWindowSeconds': 900,
          'verification.verificationTokenTtlSeconds': 600,
          'verification.bypassCode': undefined,
        };
        return values[key];
      }),
    } as unknown as ConfigService;

    const redisService = {
      isAvailable: jest.fn(() => redisAvailable),
      get: jest.fn(async (key: string) => redisStore.get(key) ?? null),
      set: jest.fn(async (key: string, value: string) => {
        redisStore.set(key, value);
      }),
      delete: jest.fn(async (key: string) => {
        redisStore.delete(key);
      }),
      increment: jest.fn(async (key: string) => {
        const next = Number(redisStore.get(key) ?? '0') + 1;
        redisStore.set(key, String(next));
        return next;
      }),
    };

    service = new OtpService(redisService as never, configService);
  });

  it('stores and verifies a code', async () => {
    const code = '123456';
    await service.storeCode(OtpPurpose.EMAIL_VERIFY, 'user@example.com', code, 'user-1');

    await expect(
      service.verifyCode(OtpPurpose.EMAIL_VERIFY, 'user@example.com', code),
    ).resolves.toEqual({ userId: 'user-1' });
  });

  it('rejects invalid codes', async () => {
    await service.storeCode(OtpPurpose.EMAIL_VERIFY, 'user@example.com', '123456', 'user-1');

    await expect(
      service.verifyCode(OtpPurpose.EMAIL_VERIFY, 'user@example.com', '000000'),
    ).rejects.toThrow(new BadRequestException('Invalid or expired verification code'));
  });

  it('rejects expired or missing codes', async () => {
    await expect(
      service.verifyCode(OtpPurpose.EMAIL_VERIFY, 'user@example.com', '123456'),
    ).rejects.toThrow(BadRequestException);
  });

  it('rate limits OTP sends', async () => {
    await service.assertCanSend(OtpPurpose.PASSWORD_RESET, 'user@example.com');
    await service.assertCanSend(OtpPurpose.PASSWORD_RESET, 'user@example.com');
    await service.assertCanSend(OtpPurpose.PASSWORD_RESET, 'user@example.com');

    await expect(
      service.assertCanSend(OtpPurpose.PASSWORD_RESET, 'user@example.com'),
    ).rejects.toMatchObject({ status: HttpStatus.TOO_MANY_REQUESTS });
  });

  it('locks out after too many invalid verification attempts', async () => {
    await service.storeCode(OtpPurpose.EMAIL_VERIFY, 'user@example.com', '123456', 'user-1');

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(
        service.verifyCode(OtpPurpose.EMAIL_VERIFY, 'user@example.com', '000000'),
      ).rejects.toThrow(BadRequestException);
    }

    await expect(
      service.verifyCode(OtpPurpose.EMAIL_VERIFY, 'user@example.com', '000000'),
    ).rejects.toMatchObject({ status: HttpStatus.TOO_MANY_REQUESTS });
  });

  it('issues and validates verification tokens', async () => {
    const token = await service.issueVerificationToken({
      userId: 'user@example.com',
      purpose: OtpPurpose.PASSWORD_RESET,
      subject: 'user@example.com',
    });

    await expect(
      service.validateVerificationToken({
        verificationToken: token.verificationToken,
        purpose: OtpPurpose.PASSWORD_RESET,
        email: 'user@example.com',
      }),
    ).resolves.toBe(true);
  });

  it('consumes verification tokens once', async () => {
    const token = await service.issueVerificationToken({
      userId: 'user-1',
      purpose: OtpPurpose.SENSITIVE_ACTION,
      subject: 'user@example.com',
    });

    await expect(
      service.consumeVerificationToken({
        verificationToken: token.verificationToken,
        purpose: OtpPurpose.SENSITIVE_ACTION,
        userId: 'user-1',
      }),
    ).resolves.toBe(true);

    await expect(
      service.validateVerificationToken({
        verificationToken: token.verificationToken,
        purpose: OtpPurpose.SENSITIVE_ACTION,
        userId: 'user-1',
      }),
    ).resolves.toBe(false);
  });

  it('rejects verification token with wrong user or purpose', async () => {
    const token = await service.issueVerificationToken({
      userId: 'user@example.com',
      purpose: OtpPurpose.PASSWORD_RESET,
      subject: 'user@example.com',
    });

    await expect(
      service.validateVerificationToken({
        verificationToken: token.verificationToken,
        purpose: OtpPurpose.EMAIL_VERIFY,
        userId: 'user@example.com',
      }),
    ).resolves.toBe(false);
  });

  it('normalizes email subjects', () => {
    expect(service.normalizeSubject('  User@Example.COM ')).toBe('user@example.com');
  });

  it('throws when redis is unavailable', async () => {
    redisAvailable = false;

    await expect(
      service.verifyCode(OtpPurpose.EMAIL_VERIFY, 'user@example.com', '123456'),
    ).rejects.toBeInstanceOf(HttpException);
  });

  describe('bypass OTP', () => {
    beforeEach(() => {
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        const values: Record<string, unknown> = {
          'verification.codeLength': 6,
          'verification.ttlSeconds': 600,
          'verification.maxVerifyAttempts': 5,
          'verification.sendRateLimit': 3,
          'verification.sendRateWindowSeconds': 900,
          'verification.verificationTokenTtlSeconds': 600,
          'verification.bypassCode': '000000',
        };
        return values[key];
      });
    });

    it('accepts bypass code without redis or stored OTP', async () => {
      redisAvailable = false;

      await expect(
        service.verifyCode(OtpPurpose.EMAIL_VERIFY, 'user@example.com', '000000', {
          userId: 'user-1',
        }),
      ).resolves.toEqual({ userId: 'user-1' });
    });

    it('rejects bypass code in production', async () => {
      const previousNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      try {
        await expect(
          service.verifyCode(OtpPurpose.EMAIL_VERIFY, 'user@example.com', '000000'),
        ).rejects.toBeInstanceOf(HttpException);
      } finally {
        process.env.NODE_ENV = previousNodeEnv;
      }
    });
  });
});
