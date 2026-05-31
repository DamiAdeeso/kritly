import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OtpChannel, OtpPurpose } from '../constants/verification.constants';
import { ApiResponseDto } from './common.dto';

export class SendOtpDto {
  @ApiProperty({ enum: OtpPurpose, example: OtpPurpose.EMAIL_VERIFY })
  @IsEnum(OtpPurpose)
  purpose!: OtpPurpose;

  @ApiProperty({ enum: OtpChannel, example: OtpChannel.EMAIL })
  @IsEnum(OtpChannel)
  channel!: OtpChannel;

  @ApiPropertyOptional({
    description: 'Recipient email for unauthenticated flows (e.g. password reset)',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class VerifyOtpDto {
  @ApiProperty({ enum: OtpPurpose, example: OtpPurpose.EMAIL_VERIFY })
  @IsEnum(OtpPurpose)
  purpose!: OtpPurpose;

  @ApiProperty({ description: 'OTP code received by email or SMS', example: '482913' })
  @IsString()
  code!: string;

  @ApiPropertyOptional({
    description: 'Recipient email when verifying an unauthenticated flow',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class SendOtpDataDto {
  @ApiProperty({ description: 'Unix timestamp when the OTP expires' })
  expiresAt!: number;

  @ApiProperty({ description: 'Seconds until the OTP expires' })
  expiresInSeconds!: number;
}

export class VerifyOtpDataDto {
  @ApiProperty({ description: 'Short-lived token proving OTP verification for a purpose' })
  @IsString()
  verificationToken!: string;

  @ApiProperty({ description: 'Unix timestamp when the verification token expires' })
  expiresAt!: number;
}

export class SendOtpResponseDto extends ApiResponseDto<SendOtpDataDto> {}

export class VerifyOtpResponseDto extends ApiResponseDto<VerifyOtpDataDto> {}
