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
  UpdateProfileRequest,
  UpdateProfileResponse as UserUpdateProfileResponse,
  UsernameAvailabilityResponse,
  UserGrpcErrorResponse,
  grpcClientCall,
  GRPC_PROTO_LOADER_OPTIONS,
  resolveGrpcMethod,
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
      loader: GRPC_PROTO_LOADER_OPTIONS,
    },
  })
  private client!: ClientGrpc;

  private userService!: UserGrpcClient;
  private getProfileRpc!: (request: GetProfileRequest) => ReturnType<UserGrpcClient['getProfile']>;
  private getProfileByUsernameRpc!: (
    request: GetProfileByUsernameRequest,
  ) => ReturnType<UserGrpcClient['getProfileByUsername']>;
  private checkUsernameRpc!: (
    request: CheckUsernameRequest,
  ) => ReturnType<UserGrpcClient['checkUsername']>;
  private setUsernameRpc!: (request: SetUsernameRequest) => ReturnType<UserGrpcClient['setUsername']>;
  private updateAvatarRpc!: (request: UpdateAvatarRequest) => ReturnType<UserGrpcClient['updateAvatar']>;
  private updateProfileRpc!: (request: UpdateProfileRequest) => ReturnType<UserGrpcClient['updateProfile']>;

  onModuleInit(): void {
    this.userService = this.client.getService<UserGrpcClient>(USER_SERVICE_NAME);
    const stub = this.userService as unknown as Record<string, unknown>;
    this.getProfileRpc = resolveGrpcMethod(stub, 'getProfile', 'GetProfile');
    this.getProfileByUsernameRpc = resolveGrpcMethod(
      stub,
      'getProfileByUsername',
      'GetProfileByUsername',
    );
    this.checkUsernameRpc = resolveGrpcMethod(stub, 'checkUsername', 'CheckUsername');
    this.setUsernameRpc = resolveGrpcMethod(stub, 'setUsername', 'SetUsername');
    this.updateAvatarRpc = resolveGrpcMethod(stub, 'updateAvatar', 'UpdateAvatar');
    this.updateProfileRpc = resolveGrpcMethod(stub, 'updateProfile', 'UpdateProfile');
  }

  getProfile(data: GetProfileRequest): Promise<ProfileResponse | UserGrpcErrorResponse | GrpcErrorResponse> {
    return grpcClientCall(this.getProfileRpc(data));
  }

  getProfileByUsername(
    data: GetProfileByUsernameRequest,
  ): Promise<ProfileResponse | UserGrpcErrorResponse | GrpcErrorResponse> {
    return grpcClientCall(this.getProfileByUsernameRpc(data));
  }

  checkUsername(
    data: CheckUsernameRequest,
  ): Promise<UsernameAvailabilityResponse | UserGrpcErrorResponse | GrpcErrorResponse> {
    return grpcClientCall(this.checkUsernameRpc(data));
  }

  setUsername(
    data: SetUsernameRequest,
  ): Promise<SetUsernameResponse | UserGrpcErrorResponse | GrpcErrorResponse> {
    return grpcClientCall(this.setUsernameRpc(data));
  }

  updateAvatar(
    data: UpdateAvatarRequest,
  ): Promise<UserUpdateProfileResponse | UserGrpcErrorResponse | GrpcErrorResponse> {
    return grpcClientCall(this.updateAvatarRpc(data));
  }

  updateProfile(
    data: UpdateProfileRequest,
  ): Promise<UserUpdateProfileResponse | UserGrpcErrorResponse | GrpcErrorResponse> {
    return grpcClientCall(this.updateProfileRpc(data));
  }
}
