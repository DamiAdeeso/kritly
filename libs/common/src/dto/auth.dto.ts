import { IsString, IsEmail, IsOptional, IsEnum, MinLength, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { AuthData, RegisterRequest } from '../generated/auth';
import { AuthProvider } from '../enums/auth.enum';
import {
  ApiResponseDto,
  EmailAvailabilityDataDto,
  EmptyDataDto,
  UsernameAvailabilityDataDto,
  ValidateTokenDataDto,
} from './common.dto';
import { AuthDataDto } from './auth-data.dto';

/** Registration payload after verification (no verificationToken on the wire to AuthService). */
export type RegisterInput = Omit<RegisterRequest, 'verificationToken'>;

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

  @ApiProperty({ description: 'Date of birth (ISO date YYYY-MM-DD)', example: '1990-05-15' })
  @IsDateString()
  dateOfBirth!: string;
}

export class SocialLoginDto {
  @ApiProperty({ enum: AuthProvider, example: AuthProvider.GOOGLE })
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

export class CheckEmailDto {
  @ApiProperty({ description: 'Email to check availability', example: 'user@example.com' })
  @IsEmail()
  email!: string;
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

export class AuthResponseDto extends ApiResponseDto<AuthDataDto> {
  @ApiProperty({ type: () => AuthDataDto })
  declare data: AuthDataDto;
}

export class LogoutResponseDto extends ApiResponseDto<EmptyDataDto> {
  @ApiProperty({ type: () => EmptyDataDto })
  declare data: EmptyDataDto;
}

/** Empty success body for logout, profile update, password change, etc. */
export class EmptySuccessResponseDto extends ApiResponseDto<EmptyDataDto> {
  @ApiProperty({ type: () => EmptyDataDto })
  declare data: EmptyDataDto;
}

export class ValidateTokenResponseDto extends ApiResponseDto<ValidateTokenDataDto> {
  @ApiProperty({ type: () => ValidateTokenDataDto })
  declare data: ValidateTokenDataDto;
}

export class EmailAvailabilityResponseDto extends ApiResponseDto<EmailAvailabilityDataDto> {
  @ApiProperty({ type: () => EmailAvailabilityDataDto })
  declare data: EmailAvailabilityDataDto;
}

export class UsernameAvailabilityResponseDto extends ApiResponseDto<UsernameAvailabilityDataDto> {
  @ApiProperty({ type: () => UsernameAvailabilityDataDto })
  declare data: UsernameAvailabilityDataDto;
}

export class SetUsernameResponseDto extends AuthResponseDto {}

export class UpdateProfileResponseDto extends EmptySuccessResponseDto {}

export { AuthDataDto, UpdateAvatarDto } from './auth-data.dto';
