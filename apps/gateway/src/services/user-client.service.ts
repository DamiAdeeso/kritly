/**
 * nice-grpc client for user/profile (auth-service).
 */
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  GrpcClientConfigService,
  NiceGrpcConnection,
  HttpClientErrorResponse,
  GetProfileRequest,
  GetProfileByUsernameRequest,
  CheckUsernameRequest,
  SetUsernameRequest,
  UpdateAvatarRequest,
  UpdateProfileRequest,
  ProfileData,
  AuthData,
  UsernameAvailabilityData,
  Empty,
  UserServiceClient,
  UserServiceDefinition,
} from '@kritly/common';

@Injectable()
export class UserClientService implements OnModuleInit, OnModuleDestroy {
  private connection!: NiceGrpcConnection<UserServiceClient>;

  constructor(private readonly grpcClientConfig: GrpcClientConfigService) {}

  onModuleInit(): void {
    this.connection = this.grpcClientConfig.connect(UserServiceDefinition, 'auth');
  }

  onModuleDestroy(): void {
    this.connection.channel.close();
  }

  getProfile(data: GetProfileRequest): Promise<ProfileData | HttpClientErrorResponse> {
    return this.connection.client.getProfile(data);
  }

  getProfileByUsername(
    data: GetProfileByUsernameRequest,
  ): Promise<ProfileData | HttpClientErrorResponse> {
    return this.connection.client.getProfileByUsername(data);
  }

  checkUsername(
    data: CheckUsernameRequest,
  ): Promise<UsernameAvailabilityData | HttpClientErrorResponse> {
    return this.connection.client.checkUsername(data);
  }

  setUsername(data: SetUsernameRequest): Promise<AuthData | HttpClientErrorResponse> {
    return this.connection.client.setUsername(data);
  }

  updateAvatar(data: UpdateAvatarRequest): Promise<Empty | HttpClientErrorResponse> {
    return this.connection.client.updateAvatar(data);
  }

  updateProfile(data: UpdateProfileRequest): Promise<Empty | HttpClientErrorResponse> {
    return this.connection.client.updateProfile(data);
  }
}
