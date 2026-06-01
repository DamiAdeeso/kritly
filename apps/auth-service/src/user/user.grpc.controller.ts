import { Controller, UseGuards } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  CheckUsernameRequest,
  GetProfileByUsernameRequest,
  GetProfileRequest,
  OtpPurpose,
  RequiresVerification,
  SetUsernameRequest,
  UpdateAvatarRequest,
  UpdateProfileRequest,
} from '@kritly/common';
import { GrpcVerificationGuard } from '../guards/grpc-verification.guard';
import { ProfileService } from './profile.service';

@Controller()
export class UserGrpcController {
  constructor(private readonly profileService: ProfileService) {}

  @GrpcMethod('UserService', 'GetProfile')
  getProfile(data: GetProfileRequest) {
    return this.profileService.getProfile(data.userId);
  }

  @GrpcMethod('UserService', 'GetProfileByUsername')
  getProfileByUsername(data: GetProfileByUsernameRequest) {
    return this.profileService.getProfileByUsername(data.username);
  }

  @GrpcMethod('UserService', 'CheckUsername')
  checkUsername(data: CheckUsernameRequest) {
    return this.profileService.checkUsername(data.username);
  }

  @GrpcMethod('UserService', 'SetUsername')
  @UseGuards(GrpcVerificationGuard)
  @RequiresVerification(OtpPurpose.SENSITIVE_ACTION)
  setUsername(data: SetUsernameRequest) {
    return this.profileService.setUsername(data.userId, data.username);
  }

  @GrpcMethod('UserService', 'UpdateAvatar')
  updateAvatar(data: UpdateAvatarRequest) {
    return this.profileService.updateAvatar(data.userId, data.avatar);
  }

  @GrpcMethod('UserService', 'UpdateProfile')
  updateProfile(data: UpdateProfileRequest) {
    return this.profileService.updateProfile(data.userId, {
      firstName: data.firstName,
      lastName: data.lastName,
      bio: data.bio,
    });
  }
}
