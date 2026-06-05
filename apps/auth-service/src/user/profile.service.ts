import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  PROFILE_CONSTANTS,
  AuthData,
  Empty,
  ProfileData,
  UpdateProfileDto,
  UsernameAvailabilityData,
} from '@kritly/common';
import { ProfileRepository } from '../repositories/profile.repository';
import { TokenService } from '../shared/token.service';

@Injectable()
export class ProfileService {
  constructor(
    @InjectPinoLogger(ProfileService.name) private readonly logger: PinoLogger,
    private readonly profileRepository: ProfileRepository,
    private readonly tokenService: TokenService,
  ) {}

  async getProfile(userId: string): Promise<ProfileData> {
    const profile = await this.profileRepository.findProfileById(userId, true);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return {
      userId: profile.userId,
      username: profile.username ?? undefined,
      displayName: profile.displayName ?? undefined,
      bio: profile.bio ?? undefined,
      avatar: profile.avatar ?? undefined,
      email: profile.email,
    };
  }

  async getProfileByUsername(username: string): Promise<ProfileData> {
    const normalizedUsername = username.trim().toLowerCase();
    const profile = await this.profileRepository.findProfileByUsername(normalizedUsername);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return {
      userId: profile.userId,
      username: profile.username ?? undefined,
      displayName: profile.displayName ?? undefined,
      bio: profile.bio ?? undefined,
      avatar: profile.avatar ?? undefined,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<Empty> {
    const displayName = dto.displayName.trim();

    if (!displayName) {
      throw new BadRequestException('Display name is required');
    }

    const profile = await this.profileRepository.findProfileById(userId);
    if (!profile) {
      throw new BadRequestException('User not found');
    }

    const update: { displayName: string; bio?: string | null } = { displayName };
    if (dto.bio !== undefined) {
      update.bio = dto.bio.trim() || null;
    }

    await this.profileRepository.updateProfile(userId, update);

    this.logger.info({ userId }, 'profile updated');

    return {};
  }

  async checkUsername(username: string): Promise<UsernameAvailabilityData> {
    const normalizedUsername = username.trim().toLowerCase();
    const existingUser = await this.profileRepository.findByUsername(normalizedUsername);
    const isAvailable = !existingUser;

    return { isAvailable };
  }

  async setUsername(userId: string, username: string): Promise<AuthData> {
    const normalizedUsername = username.trim().toLowerCase();
    if (!normalizedUsername) {
      throw new BadRequestException('Username is required');
    }

    const user = await this.profileRepository.findForUsernameUpdate(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.username === normalizedUsername) {
      throw new BadRequestException('New username must be different from your current username');
    }

    this.assertUsernameChangeAllowed(user.usernameChangedAt);

    const existingUser = await this.profileRepository.findByUsername(normalizedUsername);
    if (existingUser && existingUser.id !== userId) {
      throw new BadRequestException('Username is already taken');
    }

    await this.profileRepository.updateProfile(userId, {
      username: normalizedUsername,
      usernameChangedAt: new Date(),
    });

    this.logger.info({ userId, username: normalizedUsername }, 'username updated');

    const tokens = await this.tokenService.issueTokensForUser(userId);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: tokens.userId,
      email: tokens.email,
    };
  }

  async updateAvatar(userId: string, avatar: string): Promise<Empty> {
    const trimmedAvatar = avatar.trim();
    if (!trimmedAvatar) {
      throw new BadRequestException('Avatar URL is required');
    }

    const profile = await this.profileRepository.findProfileById(userId);
    if (!profile) {
      throw new BadRequestException('User not found');
    }

    await this.profileRepository.updateProfile(userId, { avatar: trimmedAvatar });

    return {};
  }

  private assertUsernameChangeAllowed(usernameChangedAt: Date | null | undefined): void {
    if (!usernameChangedAt) {
      return;
    }

    const cooldownMs = PROFILE_CONSTANTS.USERNAME_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
    const nextAllowedAt = usernameChangedAt.getTime() + cooldownMs;

    if (Date.now() < nextAllowedAt) {
      const daysRemaining = Math.ceil((nextAllowedAt - Date.now()) / (24 * 60 * 60 * 1000));
      throw new BadRequestException(
        `Username can only be changed once every ${PROFILE_CONSTANTS.USERNAME_CHANGE_COOLDOWN_DAYS} days. Try again in ${daysRemaining} day(s).`,
      );
    }
  }
}
