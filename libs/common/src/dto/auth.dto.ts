import { IsString, IsEmail, IsOptional, IsEnum, IsNumber, MinLength, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AuthProvider } from '../enums/auth.enum';
import {
  ApiResponseDto,
  EmptyDataDto,
  ServiceResponse,
  UsernameAvailabilityDataDto,
  ValidateTokenDataDto,
} from './common.dto';

export class LoginDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'User password', example: 'password123' })
  @IsString()
  password!: string;
}

export class RegisterDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'User password', example: 'password123' })
  @IsString()
  password!: string;

  @ApiProperty({ description: 'Username (must be unique, used as display name)', example: 'johndoe123' })
  @IsString()
  username!: string;

  @ApiProperty({
    description: 'Short-lived token from POST /api/verification/verify (email_verify purpose)',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsString()
  verificationToken!: string;

  @ApiProperty({ description: 'Date of birth (ISO date YYYY-MM-DD)', example: '1990-05-15' })
  @IsDateString()
  dateOfBirth!: string;
}

export class UpdateProfileDto {
  @ApiProperty({ description: 'User first name', example: 'John' })
  @IsString()
  firstName!: string;

  @ApiProperty({ description: 'User last name', example: 'Doe' })
  @IsString()
  lastName!: string;

  @ApiProperty({ description: 'Profile bio', example: 'Building cool things.', required: false })
  @IsOptional()
  @IsString()
  bio?: string;
}

export class SocialLoginDto {
  @ApiProperty({ description: 'Social provider', enum: AuthProvider, example: AuthProvider.GOOGLE })
  @IsEnum(AuthProvider)
  provider!: AuthProvider;

  @ApiProperty({
    description: 'OpenID ID token from Google or Apple client SDK',
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false,
  })
  @IsOptional()
  @IsString()
  idToken?: string;

  @ApiProperty({
    description: 'OAuth access token from Facebook or Instagram',
    example: 'EAABwzLix...',
    required: false,
  })
  @IsOptional()
  @IsString()
  accessToken?: string;

  @ApiProperty({
    description: 'Apple Sign In authorization code (web redirect flow)',
    required: false,
  })
  @IsOptional()
  @IsString()
  authorizationCode?: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsString()
  refreshToken!: string;
}

export class LogoutDto {
  @ApiProperty({ description: 'Refresh token to invalidate', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsString()
  refreshToken!: string;
}

export class CheckUsernameDto {
  @ApiProperty({ description: 'Username to check availability', example: 'johndoe123' })
  @IsString()
  username!: string;
}

export class SetUsernameDto {
  @ApiProperty({ description: 'Username to set', example: 'johndoe123' })
  @IsString()
  username!: string;
}

export class AuthDataDto {
  @ApiProperty({ description: 'JWT access token', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsString()
  accessToken!: string;

  @ApiProperty({ description: 'JWT refresh token', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsString()
  refreshToken!: string;

  @ApiProperty({ description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  userId!: string;

  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  @IsString()
  email!: string;
}

export class UpdateAvatarDto {
  @ApiProperty({ description: 'New avatar URL', example: 'https://example.com/avatar.jpg' })
  @IsString()
  avatar!: string;
}

export class PasswordResetRequestDto {
  @ApiProperty({ description: 'Account email address', example: 'user@example.com' })
  @IsEmail()
  email!: string;
}

export class ResetPasswordConfirmDto {
  @ApiProperty({ description: 'Account email address', example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'New password', example: 'NewPassword123' })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password', example: 'OldPassword123' })
  @IsString()
  currentPassword!: string;

  @ApiProperty({ description: 'New password', example: 'NewPassword123' })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}

export class AuthResponseDto extends ApiResponseDto<AuthDataDto> {}

export class LogoutResponseDto extends ApiResponseDto<EmptyDataDto | null> {}

export class ValidateTokenResponseDto extends ApiResponseDto<ValidateTokenDataDto> {}

export class UsernameAvailabilityResponseDto extends ApiResponseDto<UsernameAvailabilityDataDto> {}

export class SetUsernameResponseDto extends AuthResponseDto {}

export class UpdateProfileResponseDto extends ApiResponseDto<EmptyDataDto | null> {}

// Type aliases for service-layer use
export type AuthServiceResponse = ServiceResponse<AuthDataDto>;
export type LogoutServiceResponse = ServiceResponse<EmptyDataDto>;
export type ValidateTokenServiceResponse = ServiceResponse<ValidateTokenDataDto>;
export type UpdateProfileServiceResponse = ServiceResponse<EmptyDataDto>;
