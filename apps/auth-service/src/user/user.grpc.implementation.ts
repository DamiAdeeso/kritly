import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  CheckUsernameRequest,
  GetProfileByUsernameRequest,
  GetProfileRequest,
  SetUsernameRequest,
  UpdateAvatarRequest,
  UpdateProfileRequest,
  UserServiceImplementation,
} from '@kritly/common';
import { ProfileService } from './profile.service';

@Injectable()
export class UserGrpcImplementation implements UserServiceImplementation {
  constructor(
    private readonly profileService: ProfileService,
    @InjectPinoLogger(UserGrpcImplementation.name) private readonly logger: PinoLogger,
  ) {}

  getProfile(request: GetProfileRequest) {
    return this.profileService.getProfile(request.userId);
  }

  getProfileByUsername(request: GetProfileByUsernameRequest) {
    return this.profileService.getProfileByUsername(request.username);
  }

  checkUsername(request: CheckUsernameRequest) {
    return this.profileService.checkUsername(request.username);
  }

  setUsername(request: SetUsernameRequest) {
    this.logger.info({ userId: request.userId }, 'SetUsername rpc');
    return this.profileService.setUsername(request.userId, request.username);
  }

  updateAvatar(request: UpdateAvatarRequest) {
    this.logger.info({ userId: request.userId }, 'UpdateAvatar rpc');
    return this.profileService.updateAvatar(request.userId, request.avatar);
  }

  updateProfile(request: UpdateProfileRequest) {
    this.logger.info({ userId: request.userId }, 'UpdateProfile rpc');
    return this.profileService.updateProfile(request.userId, {
      displayName: request.displayName,
      bio: request.bio,
    });
  }
}
