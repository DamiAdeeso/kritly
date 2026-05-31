/**
 * gRPC client wrapper for user/profile RPCs (hosted on auth-service for now).
 */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, Client, Transport } from '@nestjs/microservices';
import { join } from 'path';
import {
  USER_SERVICE_NAME,
  UserGrpcClient,
  CheckUsernameRequest,
  GetProfileByUsernameRequest,
  GetProfileRequest,
  GrpcErrorResponse,
  ProfileResponse,
  SetUsernameRequest,
  SetUsernameResponse,
  UpdateAvatarRequest,
  UpdateProfileResponse as UserUpdateProfileResponse,
  UsernameAvailabilityResponse,
  UserGrpcErrorResponse,
} from '@kritly/common';
import { getGrpcCredentials } from '../config/grpc.config';

@Injectable()
export class UserClientService implements OnModuleInit {
  @Client({
    transport: Transport.GRPC,
    options: {
      package: 'user',
      protoPath: join(process.cwd(), 'libs/common/src/proto/user.proto'),
      url: `${process.env.AUTH_SERVICE_HOST || 'localhost'}:${process.env.AUTH_SERVICE_PORT || 3001}`,
      credentials: getGrpcCredentials(),
    },
  })
  private client!: ClientGrpc;

  private userService!: UserGrpcClient;

  onModuleInit(): void {
    this.userService = this.client.getService<UserGrpcClient>(USER_SERVICE_NAME);
  }

  getProfile(data: GetProfileRequest): Promise<ProfileResponse | UserGrpcErrorResponse | GrpcErrorResponse> {
    return this.userService.getProfile(data);
  }

  getProfileByUsername(
    data: GetProfileByUsernameRequest,
  ): Promise<ProfileResponse | UserGrpcErrorResponse | GrpcErrorResponse> {
    return this.userService.getProfileByUsername(data);
  }

  checkUsername(
    data: CheckUsernameRequest,
  ): Promise<UsernameAvailabilityResponse | UserGrpcErrorResponse | GrpcErrorResponse> {
    return this.userService.checkUsername(data);
  }

  setUsername(
    data: SetUsernameRequest,
  ): Promise<SetUsernameResponse | UserGrpcErrorResponse | GrpcErrorResponse> {
    return this.userService.setUsername(data);
  }

  updateAvatar(
    data: UpdateAvatarRequest,
  ): Promise<UserUpdateProfileResponse | UserGrpcErrorResponse | GrpcErrorResponse> {
    return this.userService.updateAvatar(data);
  }
}
