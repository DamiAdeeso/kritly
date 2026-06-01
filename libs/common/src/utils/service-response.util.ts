import { HttpException } from '@nestjs/common';
import { ServiceResponse } from '../dto/common.dto';

export function isServiceResponse(value: unknown): value is ServiceResponse<unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as ServiceResponse<unknown>;
  return (
    typeof candidate.statusCode === 'number' &&
    typeof candidate.message === 'string' &&
    'data' in candidate
  );
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export function getErrorStatus(error: unknown, fallback = 500): number {
  if (error instanceof HttpException) {
    return error.getStatus();
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number'
  ) {
    return (error as { status: number }).status;
  }

  return fallback;
}
