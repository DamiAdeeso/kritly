import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getLoggerToken } from 'nestjs-pino';
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
        {
          provide: getLoggerToken(ProfileService.name),
          useValue: { info: jest.fn(), warn: jest.fn(), debug: jest.fn(), error: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
  });

  describe('getProfile', () => {
    it('returns profile by user id', async () => {
      profileRepository.findProfileById.mockResolvedValue({
        userId: 'user-1',
        username: 'user123',
        displayName: 'Test User',
        bio: null,
        avatar: null,
        email: 'user@example.com',
      });

      const result = await service.getProfile('user-1');

      expect(result.email).toBe('user@example.com');
      expect(result.displayName).toBe('Test User');
    });

    it('throws when profile is missing', async () => {
      profileRepository.findProfileById.mockResolvedValue(null);

      await expect(service.getProfile('missing')).rejects.toThrow(
        new NotFoundException('Profile not found'),
      );
    });
  });

  describe('getProfileByUsername', () => {
    it('normalizes username before lookup', async () => {
      profileRepository.findProfileByUsername.mockResolvedValue({
        userId: 'user-1',
        username: 'testuser',
        displayName: 'Test User',
        bio: null,
        avatar: null,
      });

      await service.getProfileByUsername('  TestUser  ');

      expect(profileRepository.findProfileByUsername).toHaveBeenCalledWith('testuser');
    });

    it('throws when username is not found', async () => {
      profileRepository.findProfileByUsername.mockResolvedValue(null);

      await expect(service.getProfileByUsername('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkUsername', () => {
    it('returns available for unused username', async () => {
      profileRepository.findByUsername.mockResolvedValue(null);

      const result = await service.checkUsername('available-user');

      expect(result.isAvailable).toBe(true);
    });

    it('returns unavailable for taken username', async () => {
      profileRepository.findByUsername.mockResolvedValue({ id: 'other-user' } as never);

      const result = await service.checkUsername('taken-user');

      expect(result.isAvailable).toBe(false);
    });
  });

  describe('setUsername', () => {
    it('sets username for authenticated user', async () => {
      profileRepository.findForUsernameUpdate.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        username: 'oldname',
        usernameChangedAt: null,
      });
      profileRepository.findByUsername.mockResolvedValue(null);
      profileRepository.updateProfile.mockResolvedValue({ id: 'user-1' } as never);

      const result = await service.setUsername('user-1', '  NewName  ');

      expect(result.accessToken).toBe('access-token');
      expect(profileRepository.updateProfile).toHaveBeenCalledWith('user-1', {
        username: 'newname',
        usernameChangedAt: expect.any(Date),
      });
    });

    it('rejects empty username', async () => {
      await expect(service.setUsername('user-1', '   ')).rejects.toThrow(
        new BadRequestException('Username is required'),
      );
    });

    it('rejects when user is not found', async () => {
      profileRepository.findForUsernameUpdate.mockResolvedValue(null);

      await expect(service.setUsername('user-1', 'newname')).rejects.toThrow(
        new BadRequestException('User not found'),
      );
    });

    it('rejects unchanged username', async () => {
      profileRepository.findForUsernameUpdate.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        username: 'same',
        usernameChangedAt: null,
      });

      await expect(service.setUsername('user-1', 'same')).rejects.toThrow(BadRequestException);
    });

    it('rejects username taken by another user', async () => {
      profileRepository.findForUsernameUpdate.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        username: 'oldname',
        usernameChangedAt: null,
      });
      profileRepository.findByUsername.mockResolvedValue({ id: 'user-2' } as never);

      await expect(service.setUsername('user-1', 'taken')).rejects.toThrow(
        new BadRequestException('Username is already taken'),
      );
    });

    it('rejects username change during cooldown', async () => {
      profileRepository.findForUsernameUpdate.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        username: 'oldname',
        usernameChangedAt: new Date(),
      });

      await expect(service.setUsername('user-1', 'newname')).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateProfile', () => {
    it('updates name and bio', async () => {
      profileRepository.findProfileById.mockResolvedValue({
        userId: 'user-1',
        username: 'user123',
        displayName: null,
        bio: null,
        avatar: null,
      });
      profileRepository.updateProfile.mockResolvedValue({ id: 'user-1' } as never);

      const result = await service.updateProfile('user-1', {
        displayName: 'Jane Doe',
        bio: 'Hello world',
      });

      expect(result).toEqual({});
      expect(profileRepository.updateProfile).toHaveBeenCalledWith('user-1', {
        displayName: 'Jane Doe',
        bio: 'Hello world',
      });
    });

    it('rejects empty display name', async () => {
      await expect(
        service.updateProfile('user-1', { displayName: ' ' }),
      ).rejects.toThrow(new BadRequestException('Display name is required'));
    });
  });

  describe('updateAvatar', () => {
    it('updates avatar for authenticated user', async () => {
      profileRepository.findProfileById.mockResolvedValue({
        userId: 'user-1',
        username: 'user123',
        displayName: null,
        bio: null,
        avatar: null,
      });
      profileRepository.updateProfile.mockResolvedValue({ id: 'user-1' } as never);

      const result = await service.updateAvatar('user-1', 'https://cdn.example.com/avatar.jpg');

      expect(result).toEqual({});
    });

    it('rejects empty avatar url', async () => {
      await expect(service.updateAvatar('user-1', '   ')).rejects.toThrow(
        new BadRequestException('Avatar URL is required'),
      );
    });

    it('rejects when user is not found', async () => {
      profileRepository.findProfileById.mockResolvedValue(null);

      await expect(service.updateAvatar('user-1', 'https://cdn.example.com/a.jpg')).rejects.toThrow(
        new BadRequestException('User not found'),
      );
    });
  });
});
