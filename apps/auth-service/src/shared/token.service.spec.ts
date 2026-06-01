import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from './token.service';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { AccountRepository } from '../repositories/account.repository';

describe('TokenService', () => {
  let service: TokenService;
  let accountRepository: jest.Mocked<AccountRepository>;
  let refreshTokenRepository: jest.Mocked<RefreshTokenRepository>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    accountRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<AccountRepository>;

    refreshTokenRepository = {
      create: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<RefreshTokenRepository>;

    jwtService = {
      sign: jest.fn().mockReturnValue('access-token'),
    } as unknown as jest.Mocked<JwtService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: JwtService, useValue: jwtService },
        { provide: RefreshTokenRepository, useValue: refreshTokenRepository },
        { provide: AccountRepository, useValue: accountRepository },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
  });

  it('generates access and refresh tokens', async () => {
    const tokens = await service.generateTokens('user-1', 'user@example.com', 'USER');

    expect(tokens.accessToken).toBe('access-token');
    expect(tokens.refreshToken).toEqual(expect.any(String));
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'user@example.com',
      role: 'USER',
    });
    expect(refreshTokenRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1' }),
    );
  });

  it('issues tokens for an existing user', async () => {
    accountRepository.findById.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      role: 'USER',
    } as never);

    const result = await service.issueTokensForUser('user-1');

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: expect.any(String),
      userId: 'user-1',
      email: 'user@example.com',
    });
  });

  it('throws NotFoundException when user does not exist', async () => {
    accountRepository.findById.mockResolvedValue(null);

    await expect(service.issueTokensForUser('missing-user')).rejects.toThrow(NotFoundException);
  });
});
