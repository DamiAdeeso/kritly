import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

const ERROR_DESCRIPTIONS: Record<number, string> = {
  400: 'Validation or bad request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not found',
  409: 'Conflict',
  429: 'Too many requests',
  500: 'Internal server error',
};

/** Document standard REST error envelope responses for OpenAPI. */
export function ApiEnvelopeErrors(...statusCodes: number[]) {
  return applyDecorators(
    ...statusCodes.map((status) =>
      ApiResponse({
        status,
        description: ERROR_DESCRIPTIONS[status] ?? 'Error',
        schema: {
          type: 'object',
          required: ['statusCode', 'message', 'data'],
          properties: {
            statusCode: { type: 'number', example: status },
            message: { type: 'string', example: ERROR_DESCRIPTIONS[status] ?? 'Error' },
            data: { type: 'object', nullable: true, example: null },
          },
        },
      }),
    ),
  );
}
