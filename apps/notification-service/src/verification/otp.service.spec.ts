import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OtpService } from './otp.service';

describe('OtpService', () => {
  let service: OtpService;
  let redisStore: Map<string, string>;

  beforeEach(() => {
    redisStore = new Map();

    const configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, unknown> = {
          'verification.codeLength': 6,
          'verification.ttlSeconds': 600,
          'verification.maxVerifyAttempts': 5,
          'verification.sendRateLimit': 3,
          'verification.sendRateWindowSeconds': 900,
          'verification.verificationTokenTtlSeconds': 600,
        };
        return values[key];
      }),
    } as unknown as ConfigService;

    const redisService = {
      isAvailable: jest.fn().mockReturnValue(true),
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
    await service.storeCode('email_verify', 'user@example.com', code, 'user-1');

    await expect(service.verifyCode('email_verify', 'user@example.com', code)).resolves.toEqual({
      userId: 'user-1',
    });
  });

  it('rejects invalid codes', async () => {
    await service.storeCode('email_verify', 'user@example.com', '123456', 'user-1');

    await expect(service.verifyCode('email_verify', 'user@example.com', '000000')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
