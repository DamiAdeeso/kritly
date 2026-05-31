import { HttpException } from '@nestjs/common';
import { fail, GrpcErrorResponse } from '@kritly/common';

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

export async function toGrpcResponse<T>(
  handler: () => Promise<T>,
  fallbackMessage: string,
  fallbackStatus = 500,
): Promise<T | GrpcErrorResponse> {
  try {
    return await handler();
  } catch (error: unknown) {
    return fail(getErrorMessage(error, fallbackMessage), getErrorStatus(error, fallbackStatus));
  }
}
