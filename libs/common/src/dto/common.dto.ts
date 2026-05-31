import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 10;
}

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

  data!: T;
}

export class ErrorResponseDto {
  @IsNumber()
  statusCode!: number;

  @IsString()
  message!: string;

  @IsOptional()
  data?: null;

  @IsString()
  error!: string;

  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  timestamp?: string;
}

export class EmptyDataDto {}

export class ValidateTokenDataDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isValid!: boolean;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  userId!: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsString()
  email!: string;
}

export class UsernameAvailabilityDataDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isAvailable!: boolean;
}
