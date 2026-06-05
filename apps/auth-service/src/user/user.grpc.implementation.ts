import { Injectable } from '@nestjs/common';
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
  constructor(private readonly profileService: ProfileService) {}

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
    return this.profileService.setUsername(request.userId, request.username);
  }

  updateAvatar(request: UpdateAvatarRequest) {
    return this.profileService.updateAvatar(request.userId, request.avatar);
  }

  updateProfile(request: UpdateProfileRequest) {
    return this.profileService.updateProfile(request.userId, {
      displayName: request.displayName,
      bio: request.bio,
    });
  }
}
