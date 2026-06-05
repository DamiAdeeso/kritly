import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { LoginSessionData } from '../generated/auth';
import { ApiResponseDto } from './common.dto';
import { ProfileDataDto } from './user.dto';

/** HTTP envelope for POST /api/auth/login/session (same shape as gRPC LoginSessionData). */
export type AuthWithProfileData = LoginSessionData;

export class AuthWithProfileDataDto implements LoginSessionData {
  @ApiProperty({ description: 'JWT access token', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsString()
  accessToken!: string;

  @ApiProperty({ description: 'JWT refresh token', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsString()
  refreshToken!: string;

  @ApiProperty({ type: () => ProfileDataDto })
  profile!: ProfileDataDto;
}

export class AuthWithProfileResponseDto extends ApiResponseDto<AuthWithProfileDataDto> {
  @ApiProperty({ type: () => AuthWithProfileDataDto })
  declare data: AuthWithProfileDataDto;
}
