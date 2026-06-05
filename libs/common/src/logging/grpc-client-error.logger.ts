import { ClientError } from 'nice-grpc';
import { getClientFacingGrpcErrorMessage, grpcStatusToHttpStatus } from '../grpc/grpc-status.util';
import { createModuleLogger } from './module-logger.util';

const logger = createModuleLogger('GrpcClient');

/** Server-side audit log for gRPC client failures (includes raw details when sanitized). */
export function logGrpcClientError(error: ClientError): void {
  const clientMessage = getClientFacingGrpcErrorMessage(error);
  const sanitized = clientMessage !== (error.details?.trim() || '');

  const payload = {
    grpcCode: error.code,
    grpcPath: error.path,
    httpStatus: grpcStatusToHttpStatus(error.code),
    clientMessage,
    ...(sanitized ? { details: error.details } : {}),
  };

  if (sanitized) {
    logger.warn(payload, 'sanitized gRPC client error');
    return;
  }

  logger.info(payload, 'gRPC client error');
}
