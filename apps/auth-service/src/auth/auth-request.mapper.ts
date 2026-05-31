import { plainToInstance } from 'class-transformer';
import {
  AuthProvider,
  RegisterDto,
  RegisterRequest,
  SocialLoginDto,
  SocialLoginRequest,
} from '@kritly/common';

/** Maps gRPC requests that need custom field logic before hitting AuthService. */
export const AuthRequestMapper = {
  toRegisterDto(data: RegisterRequest): RegisterDto {
    return plainToInstance(RegisterDto, {
      ...data,
      username: data.username ?? data.email.split('@')[0],
    });
  },

  toSocialLoginDto(data: SocialLoginRequest): SocialLoginDto {
    return plainToInstance(SocialLoginDto, {
      ...data,
      provider: data.provider as AuthProvider,
    });
  },
};
