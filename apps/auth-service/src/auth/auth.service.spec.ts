jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { getLoggerToken } from 'nestjs-pino';
import * as bcrypt from 'bcryptjs';
import { AuthProvider, AUTH_CONSTANTS, DOMAIN_EVENTS, EventPublisher, RedisService } from '@kritly/common';
import { AuthService } from './auth.service';
import { AccountRepository } from '../repositories/account.repository';
import { ProfileRepository } from '../repositories/profile.repository';
import { SocialAccountRepository, RefreshTokenRepository } from '../repositories';
import { TokenService } from '../shared/token.service';
import { GoogleAuthService } from './strategies/google-auth.service';
import { FacebookAuthService } from './strategies/facebook-auth.service';
import { AppleAuthService } from './strategies/apple-auth.service';
import { InstagramAuthService } from './strategies/instagram-auth.service';
describe('AuthService', () => {
  let service: AuthService;
  let accountRepository: jest.Mocked<AccountRepository>;
  let profileRepository: jest.Mocked<ProfileRepository>;
  let socialAccountRepository: jest.Mocked<SocialAccountRepository>;
  let refreshTokenRepository: jest.Mocked<RefreshTokenRepository>;
  let tokenService: jest.Mocked<TokenService>;
  let googleAuthService: jest.Mocked<GoogleAuthService>;
  let appleAuthService: jest.Mocked<AppleAuthService>;
  let facebookAuthService: jest.Mocked<FacebookAuthService>;
  let redisService: jest.Mocked<RedisService>;
  let eventPublisher: jest.Mocked<EventPublisher>;

  const registerDto = {
    email: 'user@example.com',
    password: 'Password123',
    username: 'user123',
    dateOfBirth: '1990-01-15',
  };

  const createdUser = {
    id: 'user-1',
    email: 'user@example.com',
    username: 'user123',
    usernameChangedAt: null,
    displayName: 'Test User',
    dateOfBirth: null,
    avatar: null,
    password: 'hashed-password',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    accountRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findBySocialAccount: jest.fn(),
      updatePassword: jest.fn(),
    } as unknown as jest.Mocked<AccountRepository>;

    profileRepository = {
      findByUsername: jest.fn(),
    } as unknown as jest.Mocked<ProfileRepository>;

    socialAccountRepository = {
      create: jest.fn(),
    } as unknown as jest.Mocked<SocialAccountRepository>;

    refreshTokenRepository = {
      create: jest.fn(),
      findByToken: jest.fn(),
      delete: jest.fn(),
      findByUserId: jest.fn(),
      deleteByUserId: jest.fn(),
      deleteExpired: jest.fn(),
    } as unknown as jest.Mocked<RefreshTokenRepository>;

    tokenService = {
      generateTokens: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }),
      issueTokensForUser: jest.fn(),
    } as unknown as jest.Mocked<TokenService>;

    googleAuthService = {
      verifyIdToken: jest.fn(),
    } as unknown as jest.Mocked<GoogleAuthService>;

    appleAuthService = {
      verifyIdToken: jest.fn(),
      exchangeAuthorizationCode: jest.fn(),
    } as unknown as jest.Mocked<AppleAuthService>;

    facebookAuthService = {
      verifyAccessToken: jest.fn(),
    } as unknown as jest.Mocked<FacebookAuthService>;

    redisService = {
      get: jest.fn().mockResolvedValue(null),
      increment: jest.fn().mockResolvedValue(1),
      delete: jest.fn().mockResolvedValue(undefined),
      isAvailable: jest.fn().mockReturnValue(true),
    } as unknown as jest.Mocked<RedisService>;

    eventPublisher = {
      publish: jest.fn(),
    } as unknown as jest.Mocked<EventPublisher>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getLoggerToken(AuthService.name),
          useValue: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
        },
        { provide: AccountRepository, useValue: accountRepository },
        { provide: ProfileRepository, useValue: profileRepository },
        { provide: SocialAccountRepository, useValue: socialAccountRepository },
        { provide: RefreshTokenRepository, useValue: refreshTokenRepository },
        { provide: TokenService, useValue: tokenService },
        { provide: GoogleAuthService, useValue: googleAuthService },
        { provide: FacebookAuthService, useValue: facebookAuthService },
        { provide: AppleAuthService, useValue: appleAuthService },
        { provide: InstagramAuthService, useValue: { verifyAccessToken: jest.fn() } },
        { provide: RedisService, useValue: redisService },
        { provide: EventPublisher, useValue: eventPublisher },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('registers a new user', async () => {
      accountRepository.findByEmail.mockResolvedValue(null);
      profileRepository.findByUsername.mockResolvedValue(null);
      accountRepository.create.mockResolvedValue(createdUser as never);

      const result = await service.register(registerDto);

      expect(accountRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.com',
          dateOfBirth: expect.any(Date),
        }),
      );
      expect(accountRepository.create).not.toHaveBeenCalledWith(
        expect.objectContaining({
          role: expect.anything(),
          status: expect.anything(),
        }),
      );
      expect(result.email).toBe('user@example.com');
      expect(eventPublisher.publish).toHaveBeenCalledWith(
        DOMAIN_EVENTS.USER_REGISTERED,
        expect.objectContaining({ userId: 'user-1' }),
        expect.any(Object),
      );
    });

    it('still registers when event publishing fails', async () => {
      accountRepository.findByEmail.mockResolvedValue(null);
      profileRepository.findByUsername.mockResolvedValue(null);
      accountRepository.create.mockResolvedValue(createdUser as never);
      eventPublisher.publish.mockImplementation(() => {
        throw new Error('broker down');
      });

      const result = await service.register(registerDto);

    });

    it('rejects duplicate email', async () => {
      accountRepository.findByEmail.mockResolvedValue({ id: 'existing' } as never);

      await expect(service.register(registerDto)).rejects.toThrow(
        new BadRequestException('User already exists'),
      );
    });

    it('rejects duplicate username', async () => {
      accountRepository.findByEmail.mockResolvedValue(null);
      profileRepository.findByUsername.mockResolvedValue({ id: 'other-user' } as never);

      await expect(service.register(registerDto)).rejects.toThrow(
        new BadRequestException('Username is already taken'),
      );
    });

    it('defaults username from email when omitted', async () => {
      accountRepository.findByEmail.mockResolvedValue(null);
      profileRepository.findByUsername.mockResolvedValue(null);
      accountRepository.create.mockResolvedValue(createdUser as never);

      await service.register({
        email: 'user@example.com',
        password: 'Password123',
        dateOfBirth: '1990-01-15',
      });

      expect(profileRepository.findByUsername).toHaveBeenCalledWith('user');
      expect(accountRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'user',
        }),
      );
    });

  });

  describe('checkEmailAvailability', () => {
    it('returns available when email is not registered', async () => {
      accountRepository.findByEmail.mockResolvedValue(null);

      const result = await service.checkEmailAvailability('user@example.com');

      expect(result.isAvailable).toBe(true);
    });

    it('returns unavailable when email is registered', async () => {
      accountRepository.findByEmail.mockResolvedValue({ id: 'user-1' } as never);

      const result = await service.checkEmailAvailability('user@example.com');

      expect(result.isAvailable).toBe(false);
    });
  });

  describe('login', () => {
    it('logs in with valid credentials', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      accountRepository.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        password: 'hashed-password',
        role: 'USER',
      } as never);

      const result = await service.login({
        email: 'user@example.com',
        password: 'Password123',
      });

      expect(result.accessToken).toBeDefined();
      expect(redisService.delete).toHaveBeenCalledWith('login:attempts:user@example.com');
    });

    it('rejects unknown user and records failed attempt', async () => {
      accountRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'user@example.com', password: 'Password123' }),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));

      expect(redisService.increment).toHaveBeenCalledWith(
        'login:attempts:user@example.com',
        AUTH_CONSTANTS.LOCKOUT_DURATION / 1000,
      );
    });

    it('rejects wrong password and records failed attempt', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      accountRepository.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        password: 'hashed-password',
        role: 'USER',
      } as never);

      await expect(
        service.login({ email: 'user@example.com', password: 'WrongPassword' }),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));

      expect(redisService.increment).toHaveBeenCalledWith(
        'login:attempts:user@example.com',
        AUTH_CONSTANTS.LOCKOUT_DURATION / 1000,
      );
    });

    it('blocks login when attempts exceed the limit', async () => {
      redisService.get.mockResolvedValue(String(AUTH_CONSTANTS.MAX_LOGIN_ATTEMPTS));

      await expect(
        service.login({ email: 'user@example.com', password: 'Password123' }),
      ).rejects.toMatchObject({ status: 429 });

      expect(accountRepository.findByEmail).not.toHaveBeenCalled();
    });
  });

  describe('loginSession', () => {
    it('returns tokens and profile from the authenticated user row', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      accountRepository.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        password: 'hashed-password',
        role: 'USER',
        username: 'user123',
        displayName: 'Test User',
        bio: 'Hello',
        avatar: 'https://cdn.example.com/a.jpg',
      } as never);

      const result = await service.loginSession({
        email: 'user@example.com',
        password: 'Password123',
      });

      expect(result.accessToken).toBeDefined();
      expect(result.profile).toEqual({
        userId: 'user-1',
        email: 'user@example.com',
        username: 'user123',
        displayName: 'Test User',
        bio: 'Hello',
        avatar: 'https://cdn.example.com/a.jpg',
      });
      expect(accountRepository.findByEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('socialLogin', () => {
    const socialProfile = {
      provider: AuthProvider.GOOGLE,
      providerId: 'google-sub-1',
      email: 'social@example.com',
      displayName: 'Social User',
      avatar: 'https://cdn.example.com/a.jpg',
    };

    it('logs in existing social account user', async () => {
      googleAuthService.verifyIdToken.mockResolvedValue(socialProfile);
      accountRepository.findBySocialAccount.mockResolvedValue({
        id: 'user-1',
        email: 'social@example.com',
        role: 'USER',
      } as never);

      const result = await service.socialLogin({
        provider: AuthProvider.GOOGLE,
        idToken: 'google-id-token',
      });

      expect(result.accessToken).toBeDefined();
      expect(accountRepository.create).not.toHaveBeenCalled();
    });

    it('links social account to existing email user', async () => {
      googleAuthService.verifyIdToken.mockResolvedValue(socialProfile);
      accountRepository.findBySocialAccount.mockResolvedValue(null);
      accountRepository.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'social@example.com',
        role: 'USER',
      } as never);

      await service.socialLogin({
        provider: AuthProvider.GOOGLE,
        idToken: 'google-id-token',
      });

      expect(socialAccountRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', providerId: 'google-sub-1' }),
      );
    });

    it('creates a new user for first-time social login', async () => {
      googleAuthService.verifyIdToken.mockResolvedValue(socialProfile);
      accountRepository.findBySocialAccount.mockResolvedValue(null);
      accountRepository.findByEmail.mockResolvedValue(null);
      accountRepository.create.mockResolvedValue({
        id: 'user-2',
        email: 'social@example.com',
        role: 'USER',
      } as never);

      const result = await service.socialLogin({
        provider: AuthProvider.GOOGLE,
        idToken: 'google-id-token',
      });

      expect(result.accessToken).toBeDefined();
      expect(socialAccountRepository.create).toHaveBeenCalled();
    });

    it('requires idToken for Google', async () => {
      await expect(
        service.socialLogin({ provider: AuthProvider.GOOGLE }),
      ).rejects.toThrow(new BadRequestException('idToken is required for Google login'));
    });

    it('requires accessToken for Facebook', async () => {
      await expect(
        service.socialLogin({ provider: AuthProvider.FACEBOOK }),
      ).rejects.toThrow(new BadRequestException('accessToken is required for Facebook login'));
    });

    it('supports Apple authorizationCode exchange', async () => {
      appleAuthService.exchangeAuthorizationCode.mockResolvedValue({
        ...socialProfile,
        provider: AuthProvider.APPLE,
        providerId: 'apple-sub-1',
      });
      accountRepository.findBySocialAccount.mockResolvedValue({
        id: 'user-1',
        email: 'social@example.com',
        role: 'USER',
      } as never);

      await service.socialLogin({
        provider: AuthProvider.APPLE,
        authorizationCode: 'apple-code',
      });

      expect(appleAuthService.exchangeAuthorizationCode).toHaveBeenCalledWith('apple-code');
    });
  });

  describe('refreshToken', () => {
    it('rotates a valid refresh token', async () => {
      refreshTokenRepository.findByToken.mockResolvedValue({
        token: 'refresh-token',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 60_000),
      } as never);
      accountRepository.findById.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        role: 'USER',
      } as never);

      const result = await service.refreshToken({ refreshToken: 'refresh-token' });

      expect(result.accessToken).toBeDefined();
      expect(refreshTokenRepository.delete).toHaveBeenCalledWith('refresh-token');
    });

    it('rejects missing refresh token', async () => {
      refreshTokenRepository.findByToken.mockResolvedValue(null);

      await expect(service.refreshToken({ refreshToken: 'missing' })).rejects.toThrow(
        new UnauthorizedException('Invalid refresh token'),
      );
    });

    it('rejects expired refresh token', async () => {
      refreshTokenRepository.findByToken.mockResolvedValue({
        token: 'refresh-token',
        userId: 'user-1',
        expiresAt: new Date(Date.now() - 60_000),
      } as never);

      await expect(service.refreshToken({ refreshToken: 'refresh-token' })).rejects.toThrow(
        new UnauthorizedException('Refresh token expired'),
      );
    });
  });

  describe('logout', () => {
    it('deletes refresh token', async () => {
      const result = await service.logout('refresh-token');

      expect(result).toEqual({});
      expect(refreshTokenRepository.delete).toHaveBeenCalledWith('refresh-token');
    });
  });

  describe('resetPassword', () => {
    it('resets password and revokes refresh tokens', async () => {
      accountRepository.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        password: 'old-hash',
      } as never);

      const result = await service.resetPassword('User@Example.com', 'NewPassword123');

      expect(result).toEqual({});
      expect(accountRepository.findByEmail).toHaveBeenCalledWith('user@example.com');
      expect(refreshTokenRepository.deleteByUserId).toHaveBeenCalledWith('user-1');
    });

    it('rejects reset for unknown email', async () => {
      accountRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service.resetPassword('missing@example.com', 'NewPassword123'),
      ).rejects.toThrow(
        new BadRequestException('Unable to reset password for this account'),
      );
    });
  });

  describe('changePassword', () => {
    it('changes password when current password is valid', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      accountRepository.findById.mockResolvedValue({
        id: 'user-1',
        password: 'old-hash',
      } as never);

      const result = await service.changePassword('user-1', 'OldPassword123', 'NewPassword123');

      expect(result).toEqual({});
      expect(refreshTokenRepository.deleteByUserId).toHaveBeenCalledWith('user-1');
    });

    it('rejects when new password matches current password', async () => {
      await expect(
        service.changePassword('user-1', 'SamePassword123', 'SamePassword123'),
      ).rejects.toThrow(
        new BadRequestException('New password must be different from your current password'),
      );
    });

    it('rejects social-only accounts without password', async () => {
      accountRepository.findById.mockResolvedValue({
        id: 'user-1',
        password: null,
      } as never);

      await expect(
        service.changePassword('user-1', 'OldPassword123', 'NewPassword123'),
      ).rejects.toThrow(new BadRequestException('Password login is not enabled for this account'));
    });

    it('rejects invalid current password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      accountRepository.findById.mockResolvedValue({
        id: 'user-1',
        password: 'old-hash',
      } as never);

      await expect(
        service.changePassword('user-1', 'WrongPassword123', 'NewPassword123'),
      ).rejects.toThrow(new UnauthorizedException('Current password is incorrect'));
    });
  });
});
