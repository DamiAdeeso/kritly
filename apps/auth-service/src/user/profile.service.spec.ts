import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileRepository } from '../repositories/profile.repository';
import { TokenService } from '../shared/token.service';

describe('ProfileService', () => {
  let service: ProfileService;
  let profileRepository: jest.Mocked<ProfileRepository>;
  let tokenService: jest.Mocked<TokenService>;

  beforeEach(async () => {
    profileRepository = {
      findByUsername: jest.fn(),
      findForUsernameUpdate: jest.fn(),
      findProfileById: jest.fn(),
      findProfileByUsername: jest.fn(),
      updateProfile: jest.fn(),
    } as unknown as jest.Mocked<ProfileRepository>;

    tokenService = {
      issueTokensForUser: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        userId: 'user-1',
        email: 'user@example.com',
      }),
      generateTokens: jest.fn(),
    } as unknown as jest.Mocked<TokenService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: ProfileRepository, useValue: profileRepository },
        { provide: TokenService, useValue: tokenService },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
  });

  it('checks username availability', async () => {
    profileRepository.findByUsername.mockResolvedValue(null);

    const result = await service.checkUsername('available-user');

    expect(result.data?.isAvailable).toBe(true);
    expect(result.statusCode).toBe(200);
  });

  it('sets username for authenticated user', async () => {
    profileRepository.findForUsernameUpdate.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      username: 'oldname',
      usernameChangedAt: null,
    });
    profileRepository.findByUsername.mockResolvedValue(null);
    profileRepository.updateProfile.mockResolvedValue({ id: 'user-1' } as never);

    const result = await service.setUsername('user-1', 'newname');

    expect(result.statusCode).toBe(200);
    expect(result.data?.userId).toBe('user-1');
    expect(profileRepository.updateProfile).toHaveBeenCalledWith('user-1', {
      username: 'newname',
      usernameChangedAt: expect.any(Date),
    });
    expect(tokenService.issueTokensForUser).toHaveBeenCalledWith('user-1');
  });

  it('rejects username change during cooldown', async () => {
    profileRepository.findForUsernameUpdate.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      username: 'oldname',
      usernameChangedAt: new Date(),
    });

    await expect(service.setUsername('user-1', 'newname')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates avatar for authenticated user', async () => {
    profileRepository.findProfileById.mockResolvedValue({
      userId: 'user-1',
      username: 'user123',
      firstName: 'Test',
      lastName: 'User',
      avatar: null,
    });
    profileRepository.updateProfile.mockResolvedValue({ id: 'user-1' } as never);

    const result = await service.updateAvatar('user-1', 'https://cdn.example.com/avatar.jpg');

    expect(result.statusCode).toBe(200);
    expect(profileRepository.updateProfile).toHaveBeenCalledWith('user-1', {
      avatar: 'https://cdn.example.com/avatar.jpg',
    });
  });
});
