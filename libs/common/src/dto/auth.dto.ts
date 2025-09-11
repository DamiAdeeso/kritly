import { IsString, IsEmail, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AuthProvider } from '../enums/auth.enum';

export class LoginDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password', example: 'password123' })
  @IsString()
  password: string;
}

export class RegisterDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password', example: 'password123' })
  @IsString()
  password: string;

  @ApiProperty({ description: 'Username (must be unique)', example: 'johndoe123' })
  @IsString()
  username: string;

  @ApiProperty({ description: 'User display name', example: 'John Doe' })
  @IsString()
  displayName: string;

  @ApiProperty({ description: 'User first name', example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'User last name', example: 'Doe' })
  @IsString()
  lastName: string;
}

export class SocialLoginDto {
  @ApiProperty({ description: 'Social provider', enum: AuthProvider, example: AuthProvider.GOOGLE })
  @IsEnum(AuthProvider)
  provider: AuthProvider;

  @ApiProperty({ description: 'Social access token', example: 'ya29.a0AfH6SMC...' })
  @IsString()
  accessToken: string;

  @ApiProperty({ description: 'User email from social provider', example: 'user@example.com', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'User first name from social provider', example: 'John', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ description: 'User last name from social provider', example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ description: 'User avatar URL from social provider', example: 'https://example.com/avatar.jpg', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ description: 'Social refresh token', example: '1//04dX...', required: false })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsString()
  refreshToken: string;
}

export class LogoutDto {
  @ApiProperty({ description: 'Refresh token to invalidate', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsString()
  refreshToken: string;
}

export class CheckUsernameDto {
  @ApiProperty({ description: 'Username to check availability', example: 'johndoe123' })
  @IsString()
  username: string;
}

export class UsernameAvailabilityResponseDto {
  @ApiProperty({ description: 'Response message', example: 'Username is available' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Whether username is available', example: true })
  isAvailable: boolean;

  @ApiProperty({ description: 'HTTP status code', example: 200 })
  @IsNumber()
  statusCode: number;
}

export class SetUsernameDto {
  @ApiProperty({ description: 'Username to set', example: 'johndoe123' })
  @IsString()
  username: string;
}

export class AuthDataDto {
  @ApiProperty({ description: 'JWT access token', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsString()
  accessToken: string;

  @ApiProperty({ description: 'JWT refresh token', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsString()
  refreshToken: string;

  @ApiProperty({ description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  @IsString()
  email: string;
}

export class SetUsernameResponseDto {
  @ApiProperty({ description: 'Response message', example: 'Username set successfully' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'User data', type: AuthDataDto })
  data: AuthDataDto;

  @ApiProperty({ description: 'HTTP status code', example: 200 })
  @IsNumber()
  statusCode: number;
}

export class UpdateDisplayNameDto {
  @ApiProperty({ description: 'New display name', example: 'John Doe' })
  @IsString()
  displayName: string;
}

export class UpdateAvatarDto {
  @ApiProperty({ description: 'New avatar URL', example: 'https://example.com/avatar.jpg' })
  @IsString()
  avatar: string;
}

export class UpdateProfileResponseDto {
  @ApiProperty({ description: 'Response message', example: 'Profile updated successfully' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'HTTP status code', example: 200 })
  @IsNumber()
  statusCode: number;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'Response message', example: 'User registered successfully' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Authentication data', type: AuthDataDto })
  data: AuthDataDto;

  @ApiProperty({ description: 'HTTP status code', example: 201 })
  @IsNumber()
  statusCode: number;
}
