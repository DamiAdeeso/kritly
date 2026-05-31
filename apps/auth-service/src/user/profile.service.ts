import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  PROFILE_CONSTANTS,
  ProfileServiceResponse,
  SetUsernameServiceResponse,
  UsernameAvailabilityServiceResponse,
  UpdateProfileServiceResponse,
  ok,
  okEmpty,
} from '@kritly/common';
import { ProfileRepository } from '../repositories/profile.repository';
import { TokenService } from '../shared/token.service';

@Injectable()
export class ProfileService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly tokenService: TokenService,
  ) {}

  async getProfile(userId: string): Promise<ProfileServiceResponse> {
    const profile = await this.profileRepository.findProfileById(userId, true);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return ok('Profile retrieved successfully', {
      userId: profile.userId,
      username: profile.username ?? undefined,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatar: profile.avatar ?? undefined,
      email: profile.email,
    });
  }

  async getProfileByUsername(username: string): Promise<ProfileServiceResponse> {
    const normalizedUsername = username.trim().toLowerCase();
    const profile = await this.profileRepository.findProfileByUsername(normalizedUsername);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return ok('Profile retrieved successfully', {
      userId: profile.userId,
      username: profile.username ?? undefined,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatar: profile.avatar ?? undefined,
    });
  }

  async checkUsername(username: string): Promise<UsernameAvailabilityServiceResponse> {
    const normalizedUsername = username.trim().toLowerCase();
    const existingUser = await this.profileRepository.findByUsername(normalizedUsername);
    const isAvailable = !existingUser;

    return ok(isAvailable ? 'Username is available' : 'Username is already taken', { isAvailable });
  }

  async setUsername(userId: string, username: string): Promise<SetUsernameServiceResponse> {
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

    const tokens = await this.tokenService.issueTokensForUser(userId);

    return ok('Username set successfully', {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: tokens.userId,
      email: tokens.email,
    });
  }

  async updateAvatar(userId: string, avatar: string): Promise<UpdateProfileServiceResponse> {
    const trimmedAvatar = avatar.trim();
    if (!trimmedAvatar) {
      throw new BadRequestException('Avatar URL is required');
    }

    const profile = await this.profileRepository.findProfileById(userId);
    if (!profile) {
      throw new BadRequestException('User not found');
    }

    await this.profileRepository.updateProfile(userId, { avatar: trimmedAvatar });

    return okEmpty('Avatar updated successfully');
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
