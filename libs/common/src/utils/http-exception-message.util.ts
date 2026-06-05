import { HttpException } from '@nestjs/common';

/** Extract a string message from a Nest HTTP exception for the REST error envelope. */
export function getHttpExceptionMessage(exception: HttpException): string {
  const response = exception.getResponse();

  if (typeof response === 'string') {
    return response;
  }

  if (typeof response === 'object' && response !== null && 'message' in response) {
    const message = (response as { message: unknown }).message;
    if (Array.isArray(message)) {
      return message.map(String).join(', ');
    }
    if (typeof message === 'string') {
      return message;
    }
  }

  return exception.message;
}
