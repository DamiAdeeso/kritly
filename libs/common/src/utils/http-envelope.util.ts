import { EmptyDataDto, fail, ok, okEmpty, ServiceResponse } from '../dto/common.dto';
import type { HttpClientErrorResponse } from '../interfaces/http-client.interface';
import { isServiceResponse } from './service-response.util';

export type HttpDataResult<T> = T | HttpClientErrorResponse;

/** True when a wrapped gRPC client returned the HTTP error envelope (data is null). */
export function isHttpClientError(result: unknown): result is HttpClientErrorResponse {
  return isServiceResponse(result) && result.data === null;
}

/** Wrap successful gRPC payload data in the HTTP REST envelope. */
export function mapGrpcToHttp<T>(
  result: HttpDataResult<T>,
  message: string,
  statusCode = 200,
): ServiceResponse<T> | HttpClientErrorResponse {
  if (isHttpClientError(result)) {
    return result;
  }
  return ok(message, result, statusCode);
}

/** Wrap empty gRPC success (google.protobuf.Empty) for HTTP. */
export function mapGrpcEmptyToHttp(
  result: HttpDataResult<unknown>,
  message: string,
  statusCode = 200,
): ServiceResponse<EmptyDataDto> | HttpClientErrorResponse {
  if (isHttpClientError(result)) {
    return result;
  }
  return okEmpty(message, statusCode);
}

/** Build a REST error envelope for gateway-local validation failures. */
export function httpFail(message: string, statusCode: number): HttpClientErrorResponse {
  return fail(message, statusCode);
}

/** Map availability RPC/HTTP client results with correct success copy (passes through RPC errors). */
export function mapAvailabilityToHttp<T extends { isAvailable: boolean }>(
  result: HttpDataResult<T>,
  availableMessage: string,
  unavailableMessage: string,
): ServiceResponse<T> | HttpClientErrorResponse {
  if (isHttpClientError(result)) {
    return result;
  }
  const message = result.isAvailable ? availableMessage : unavailableMessage;
  return ok(message, result);
}
