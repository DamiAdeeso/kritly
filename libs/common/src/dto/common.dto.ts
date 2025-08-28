import { IsString, IsOptional, IsNumber } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 10;
}

export class ApiResponseDto<T> {
  @IsString()
  message: string;

  data: T;

  @IsOptional()
  @IsNumber()
  statusCode?: number;
}

export class ErrorResponseDto {
  @IsString()
  message: string;

  @IsString()
  error: string;

  @IsNumber()
  statusCode: number;

  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  timestamp?: string;
}
