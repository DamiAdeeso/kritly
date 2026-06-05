import { HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { ClientError, ServerError, Status } from 'nice-grpc';
import {
  clientErrorToHttpEnvelope,
  getClientFacingGrpcErrorMessage,
  grpcStatusToHttpStatus,
  httpStatusToGrpcStatus,
  toServerError,
} from './grpc-status.util';
import { runGrpcHandler } from './grpc-server.util';

describe('grpc-status.util', () => {
  it('maps HTTP statuses to gRPC statuses', () => {
    expect(httpStatusToGrpcStatus(401)).toBe(Status.UNAUTHENTICATED);
    expect(httpStatusToGrpcStatus(429)).toBe(Status.RESOURCE_EXHAUSTED);
  });

  it('maps gRPC statuses to HTTP statuses', () => {
    expect(grpcStatusToHttpStatus(Status.UNAUTHENTICATED)).toBe(401);
    expect(grpcStatusToHttpStatus(Status.RESOURCE_EXHAUSTED)).toBe(429);
  });

  it('converts Nest exceptions to ServerError', () => {
    const error = toServerError(new UnauthorizedException('Invalid credentials'));
    expect(error).toBeInstanceOf(ServerError);
    expect(error.code).toBe(Status.UNAUTHENTICATED);
    expect(error.details).toBe('Invalid credentials');
  });

  it('converts ClientError to gateway error envelope', () => {
    const envelope = clientErrorToHttpEnvelope(
      new ClientError('/auth.AuthService/Login', Status.UNAUTHENTICATED, 'Invalid credentials'),
    );
    expect(envelope).toEqual({
      statusCode: 401,
      message: 'Invalid credentials',
      data: null,
    });
  });

  it('forwards business gRPC error details to clients', () => {
    const error = new ClientError('/auth.AuthService/Login', Status.INVALID_ARGUMENT, 'Email is required');
    expect(getClientFacingGrpcErrorMessage(error)).toBe('Email is required');
  });

  it('sanitizes UNAVAILABLE transport errors', () => {
    const error = new ClientError(
      '/auth.AuthService/Login',
      Status.UNAVAILABLE,
      '14 UNAVAILABLE: No connection established. Last error: Error: connect ECONNREFUSED ::1:3001',
    );
    expect(getClientFacingGrpcErrorMessage(error)).toBe('Service temporarily unavailable');
    expect(clientErrorToHttpEnvelope(error)).toEqual({
      statusCode: 503,
      message: 'Service temporarily unavailable',
      data: null,
    });
  });

  it('sanitizes INTERNAL and UNKNOWN errors', () => {
    expect(
      getClientFacingGrpcErrorMessage(
        new ClientError('/auth.AuthService/Login', Status.INTERNAL, 'PrismaClientKnownRequestError: ...'),
      ),
    ).toBe('Internal server error');
    expect(
      getClientFacingGrpcErrorMessage(new ClientError('/auth.AuthService/Login', Status.UNKNOWN, 'weird failure')),
    ).toBe('Internal server error');
  });

  it('uses a fallback when safe codes have empty details', () => {
    expect(
      getClientFacingGrpcErrorMessage(new ClientError('/auth.AuthService/Login', Status.NOT_FOUND, '   ')),
    ).toBe('Request failed');
  });
});

describe('runGrpcHandler with native errors', () => {
  it('throws ServerError for HTTP exceptions', async () => {
    await expect(
      runGrpcHandler(async () => {
        throw new UnauthorizedException('Invalid credentials');
      }),
    ).rejects.toMatchObject({
      code: Status.UNAUTHENTICATED,
      details: 'Invalid credentials',
    });
  });

  it('maps rate limiting to RESOURCE_EXHAUSTED', async () => {
    await expect(
      runGrpcHandler(async () => {
        throw new HttpException('Too many attempts', HttpStatus.TOO_MANY_REQUESTS);
      }),
    ).rejects.toMatchObject({
      code: Status.RESOURCE_EXHAUSTED,
      details: 'Too many attempts',
    });
  });
});
