jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { AccountRepository } from '../repositories/account.repository';
import { ProfileRepository } from '../repositories/profile.repository';
import { SocialAccountRepository, RefreshTokenRepository } from '../repositories';
import { TokenService } from '../shared/token.service';
import { GoogleAuthService } from './strategies/google-auth.service';
import { FacebookAuthService } from './strategies/facebook-auth.service';
import { AppleAuthService } from './strategies/apple-auth.service';
import { InstagramAuthService } from './strategies/instagram-auth.service';
import { LoginLockoutService } from '../redis/login-lockout.service';
import { EventPublisher } from '@kritly/common';

describe('AuthService', () => {
  let service: AuthService;
  let accountRepository: jest.Mocked<AccountRepository>;
  let profileRepository: jest.Mocked<ProfileRepository>;
  let refreshTokenRepository: jest.Mocked<RefreshTokenRepository>;
  let tokenService: jest.Mocked<TokenService>;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AccountRepository, useValue: accountRepository },
        { provide: ProfileRepository, useValue: profileRepository },
        { provide: SocialAccountRepository, useValue: { create: jest.fn() } },
        { provide: RefreshTokenRepository, useValue: refreshTokenRepository },
        { provide: TokenService, useValue: tokenService },
        { provide: JwtService, useValue: { sign: jest.fn(), verify: jest.fn() } },
        { provide: GoogleAuthService, useValue: { verifyToken: jest.fn() } },
        { provide: FacebookAuthService, useValue: { verifyToken: jest.fn() } },
        { provide: AppleAuthService, useValue: { verifyToken: jest.fn() } },
        { provide: InstagramAuthService, useValue: { verifyToken: jest.fn() } },
        {
          provide: LoginLockoutService,
          useValue: {
            assertNotLocked: jest.fn().mockResolvedValue(undefined),
            recordFailedAttempt: jest.fn().mockResolvedValue(undefined),
            clearAttempts: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: EventPublisher,
          useValue: {
            publish: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('registers a new user', async () => {
    accountRepository.findByEmail.mockResolvedValue(null);
    profileRepository.findByUsername.mockResolvedValue(null);
    accountRepository.create.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      username: 'user123',
      usernameChangedAt: null,
      firstName: 'Test',
      lastName: 'User',
      dateOfBirth: null,
      avatar: null,
      password: 'hashed-password',
      role: 'USER',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const result = await service.register({
      email: 'user@example.com',
      password: 'Password123',
      username: 'user123',
      firstName: 'Test',
      lastName: 'User',
    });

    expect(result.statusCode).toBe(201);
    expect(result.data.email).toBe('user@example.com');
    expect(result.data.accessToken).toBe('access-token');
    expect(bcrypt.hash).toHaveBeenCalled();
    expect(tokenService.generateTokens).toHaveBeenCalledWith('user-1', 'user@example.com', 'USER');
  });

  it('rejects duplicate registration', async () => {
    accountRepository.findByEmail.mockResolvedValue({ id: 'existing' } as never);

    await expect(
      service.register({
        email: 'user@example.com',
        password: 'Password123',
        username: 'user123',
        firstName: 'Test',
        lastName: 'User',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

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

    expect(result.statusCode).toBe(200);
    expect(result.data.userId).toBe('user-1');
  });

  it('rejects invalid login credentials', async () => {
    accountRepository.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'user@example.com',
        password: 'Password123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('resets password and revokes refresh tokens', async () => {
    accountRepository.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      password: 'old-hash',
    } as never);
    accountRepository.updatePassword.mockResolvedValue({ id: 'user-1' } as never);

    const result = await service.resetPassword('user@example.com', 'NewPassword123');

    expect(result.statusCode).toBe(200);
    expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123', expect.any(Number));
    expect(accountRepository.updatePassword).toHaveBeenCalledWith('user-1', 'hashed-password');
    expect(refreshTokenRepository.deleteByUserId).toHaveBeenCalledWith('user-1');
  });

  it('changes password when current password is valid', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    accountRepository.findById.mockResolvedValue({
      id: 'user-1',
      password: 'old-hash',
    } as never);
    accountRepository.updatePassword.mockResolvedValue({ id: 'user-1' } as never);

    const result = await service.changePassword('user-1', 'OldPassword123', 'NewPassword123');

    expect(result.statusCode).toBe(200);
    expect(refreshTokenRepository.deleteByUserId).toHaveBeenCalledWith('user-1');
  });

  it('rejects change password with invalid current password', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    accountRepository.findById.mockResolvedValue({
      id: 'user-1',
      password: 'old-hash',
    } as never);

    await expect(
      service.changePassword('user-1', 'WrongPassword123', 'NewPassword123'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
