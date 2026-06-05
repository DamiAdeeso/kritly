import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { AuthData } from '../generated/auth';

export class AuthDataDto implements AuthData {
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
