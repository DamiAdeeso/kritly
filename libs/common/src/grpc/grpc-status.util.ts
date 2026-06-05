import { ClientError, ServerError, Status } from 'nice-grpc';
import { fail, ServiceResponse } from '../dto/common.dto';
import { logGrpcClientError } from '../logging/grpc-client-error.logger';
import { getErrorMessage, getErrorStatus } from '../utils/service-response.util';

/** Map HTTP status codes (Nest exceptions) to gRPC status codes. */
export function httpStatusToGrpcStatus(httpStatus: number): Status {
  switch (httpStatus) {
    case 400:
      return Status.INVALID_ARGUMENT;
    case 401:
      return Status.UNAUTHENTICATED;
    case 403:
      return Status.PERMISSION_DENIED;
    case 404:
      return Status.NOT_FOUND;
    case 409:
      return Status.ALREADY_EXISTS;
    case 412:
      return Status.FAILED_PRECONDITION;
    case 429:
      return Status.RESOURCE_EXHAUSTED;
    case 501:
      return Status.UNIMPLEMENTED;
    case 503:
      return Status.UNAVAILABLE;
    default:
      return httpStatus >= 500 ? Status.INTERNAL : Status.UNKNOWN;
  }
}

/** Map gRPC status codes to HTTP status for the gateway REST envelope. */
export function grpcStatusToHttpStatus(code: Status): number {
  switch (code) {
    case Status.OK:
      return 200;
    case Status.INVALID_ARGUMENT:
    case Status.FAILED_PRECONDITION:
      return 400;
    case Status.UNAUTHENTICATED:
      return 401;
    case Status.PERMISSION_DENIED:
      return 403;
    case Status.NOT_FOUND:
      return 404;
    case Status.ALREADY_EXISTS:
      return 409;
    case Status.RESOURCE_EXHAUSTED:
      return 429;
    case Status.UNAVAILABLE:
      return 503;
    case Status.UNIMPLEMENTED:
      return 501;
    case Status.DEADLINE_EXCEEDED:
      return 504;
    case Status.CANCELLED:
      return 499;
    default:
      return 500;
  }
}

export function toServerError(exception: unknown): ServerError {
  if (exception instanceof ServerError) {
    return exception;
  }

  const message = getErrorMessage(exception, 'Internal server error');
  const httpStatus = getErrorStatus(exception, 500);
  return new ServerError(httpStatusToGrpcStatus(httpStatus), message);
}

/** gRPC codes whose `details` are intentional business messages safe to expose to clients. */
const CLIENT_SAFE_GRPC_CODES = new Set<Status>([
  Status.INVALID_ARGUMENT,
  Status.UNAUTHENTICATED,
  Status.PERMISSION_DENIED,
  Status.NOT_FOUND,
  Status.ALREADY_EXISTS,
  Status.FAILED_PRECONDITION,
  Status.RESOURCE_EXHAUSTED,
]);

const GENERIC_GRPC_CLIENT_MESSAGES: Partial<Record<Status, string>> = {
  [Status.UNAVAILABLE]: 'Service temporarily unavailable',
  [Status.DEADLINE_EXCEEDED]: 'Request timed out',
  [Status.INTERNAL]: 'Internal server error',
  [Status.UNKNOWN]: 'Internal server error',
  [Status.UNIMPLEMENTED]: 'This feature is not available',
  [Status.CANCELLED]: 'Request was cancelled',
};

/** Client-safe message for a gRPC client error (hides transport/infrastructure details). */
export function getClientFacingGrpcErrorMessage(error: ClientError): string {
  const details = error.details?.trim();

  if (CLIENT_SAFE_GRPC_CODES.has(error.code)) {
    return details || 'Request failed';
  }

  return GENERIC_GRPC_CLIENT_MESSAGES[error.code] ?? 'Internal server error';
}

/** Convert a gRPC client error into the HTTP-facing error envelope. */
export function clientErrorToHttpEnvelope(error: ClientError): ServiceResponse<null> {
  return fail(getClientFacingGrpcErrorMessage(error), grpcStatusToHttpStatus(error.code));
}

/**
 * Run a nice-grpc client call; map native gRPC errors to the HTTP error envelope.
 * Success responses are proto data messages returned unchanged.
 */
export async function callGrpc<T>(fn: () => Promise<T>): Promise<T | ServiceResponse<null>> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ClientError) {
      logGrpcClientError(error);
      return clientErrorToHttpEnvelope(error);
    }
    throw error;
  }
}
