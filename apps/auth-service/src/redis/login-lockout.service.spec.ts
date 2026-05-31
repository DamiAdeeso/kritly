import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AUTH_CONSTANTS } from '@kritly/common';
import { LoginLockoutService } from './login-lockout.service';
import { RedisService } from './redis.service';

describe('LoginLockoutService', () => {
  let service: LoginLockoutService;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    redisService = {
      get: jest.fn(),
      increment: jest.fn(),
      delete: jest.fn(),
      isAvailable: jest.fn().mockReturnValue(true),
    } as unknown as jest.Mocked<RedisService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginLockoutService,
        { provide: RedisService, useValue: redisService },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<LoginLockoutService>(LoginLockoutService);
  });

  it('blocks login when attempts exceed the limit', async () => {
    redisService.get.mockResolvedValue(String(AUTH_CONSTANTS.MAX_LOGIN_ATTEMPTS));

    await expect(service.assertNotLocked('user@example.com')).rejects.toMatchObject({
      status: 429,
    });
  });

  it('records failed attempts in redis', async () => {
    await service.recordFailedAttempt('user@example.com');

    expect(redisService.increment).toHaveBeenCalledWith(
      'login:attempts:user@example.com',
      AUTH_CONSTANTS.LOCKOUT_DURATION,
    );
  });
});
