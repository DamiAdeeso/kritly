import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { EmailAvailabilityData } from '../generated/auth';
import type { UsernameAvailabilityData } from '../generated/user';

/** HTTP-only payload for GET /api/auth/validate (local JWT check at the gateway, not gRPC). */
export interface ValidateTokenData {
  isValid: boolean;
  userId: string;
}

/** REST API response shape (gateway only). gRPC success returns proto data messages directly. */
export interface ServiceResponse<T = null> {
  statusCode: number;
  message: string;
  data: T;
}

export function ok<T>(message: string, data: T, statusCode = 200): ServiceResponse<T> {
  return { statusCode, message, data };
}

export function okEmpty(message: string, statusCode = 200): ServiceResponse<EmptyDataDto> {
  return { statusCode, message, data: {} };
}

/** Gateway-only error envelope builder. Prefer mapGrpcToHttp / httpFail at HTTP boundaries. */
export function fail(message: string, statusCode: number): ServiceResponse<null> {
  return { statusCode, message, data: null };
}

export class ApiResponseDto<T> implements ServiceResponse<T> {
  @ApiProperty({ example: 200 })
  @IsNumber()
  statusCode!: number;

  @ApiProperty({ example: 'Operation successful' })
  @IsString()
  message!: string;

  @ApiPropertyOptional()
  data!: T;
}

export class EmptyDataDto {}

export class ValidateTokenDataDto implements ValidateTokenData {
  @ApiProperty({ example: true })
  @IsBoolean()
  isValid!: boolean;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  userId!: string;
}

export class UsernameAvailabilityDataDto implements UsernameAvailabilityData {
  @ApiProperty({ example: true })
  @IsBoolean()
  isAvailable!: boolean;
}

export class EmailAvailabilityDataDto implements EmailAvailabilityData {
  @ApiProperty({ example: true })
  @IsBoolean()
  isAvailable!: boolean;
}
