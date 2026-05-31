import type {
  CheckUsernameRequest,
  GetProfileByUsernameRequest,
  GetProfileRequest,
  ProfileResponse,
  SetUsernameRequest,
  SetUsernameResponse,
  UpdateAvatarRequest,
  UpdateProfileResponse,
  UsernameAvailabilityResponse,
} from '../generated/user';
import type { ServiceResponse } from '../dto/common.dto';

export type {
  CheckUsernameRequest,
  EmptyData as UserEmptyData,
  GetProfileByUsernameRequest,
  GetProfileRequest,
  ProfileData,
  ProfileResponse,
  SetUsernameAuthData,
  SetUsernameRequest,
  SetUsernameResponse,
  UpdateAvatarRequest,
  UpdateProfileResponse as UserUpdateProfileResponse,
  UsernameAvailabilityData,
  UsernameAvailabilityResponse,
} from '../generated/user';

export const USER_SERVICE_NAME = 'UserService';

export type UserGrpcErrorResponse = ServiceResponse<null>;

export interface UserServiceClient {
  getProfile(request: GetProfileRequest): Promise<ProfileResponse>;
  getProfileByUsername(request: GetProfileByUsernameRequest): Promise<ProfileResponse>;
  checkUsername(request: CheckUsernameRequest): Promise<UsernameAvailabilityResponse>;
  setUsername(request: SetUsernameRequest): Promise<SetUsernameResponse>;
  updateAvatar(request: UpdateAvatarRequest): Promise<UpdateProfileResponse>;
}

export type UserGrpcClient = UserServiceClient;

export type ProfileServiceResponse = ServiceResponse<{
  userId: string;
  username?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  email?: string;
}>;

export type SetUsernameServiceResponse = ServiceResponse<{
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
}>;

export type UsernameAvailabilityServiceResponse = ServiceResponse<{ isAvailable: boolean }>;
