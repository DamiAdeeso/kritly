import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  CheckUsernameRequest,
  GetProfileByUsernameRequest,
  GetProfileRequest,
  SetUsernameRequest,
  UpdateAvatarRequest,
} from '@kritly/common';
import { ProfileService } from './profile.service';
import { toGrpcResponse } from '../shared/grpc-error.util';

@Controller()
export class UserGrpcController {
  constructor(private readonly profileService: ProfileService) {}

  @GrpcMethod('UserService', 'GetProfile')
  getProfile(data: GetProfileRequest) {
    return toGrpcResponse(
      () => this.profileService.getProfile(data.userId),
      'Profile retrieval failed',
    );
  }

  @GrpcMethod('UserService', 'GetProfileByUsername')
  getProfileByUsername(data: GetProfileByUsernameRequest) {
    return toGrpcResponse(
      () => this.profileService.getProfileByUsername(data.username),
      'Profile retrieval failed',
    );
  }

  @GrpcMethod('UserService', 'CheckUsername')
  checkUsername(data: CheckUsernameRequest) {
    return toGrpcResponse(
      () => this.profileService.checkUsername(data.username),
      'Username check failed',
    );
  }

  @GrpcMethod('UserService', 'SetUsername')
  setUsername(data: SetUsernameRequest) {
    return toGrpcResponse(
      () => this.profileService.setUsername(data.userId, data.username),
      'Username set failed',
    );
  }

  @GrpcMethod('UserService', 'UpdateAvatar')
  updateAvatar(data: UpdateAvatarRequest) {
    return toGrpcResponse(
      () => this.profileService.updateAvatar(data.userId, data.avatar),
      'Avatar update failed',
    );
  }
}
