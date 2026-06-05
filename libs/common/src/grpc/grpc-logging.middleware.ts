import type { CallContext, ServerMiddlewareCall } from 'nice-grpc';

export interface GrpcRequestLogger {
  info(obj: Record<string, unknown>, msg?: string): void;
  error(obj: Record<string, unknown>, msg?: string): void;
}

const HEALTH_RPC_PATH = '/grpc.health.v1.Health/';

/** Log gRPC method, duration, and outcome (skips standard health check RPCs). */
export function createGrpcLoggingMiddleware(logger: GrpcRequestLogger) {
  return async function* grpcLoggingMiddleware<Request, Response>(
    call: ServerMiddlewareCall<Request, Response>,
    _context: CallContext,
  ) {
    const methodPath = call.method.path;
    const skipLog = methodPath.includes(HEALTH_RPC_PATH);

    if (skipLog) {
      return yield* call.next(call.request, _context);
    }

    const start = Date.now();
    const meta = { method: methodPath };

    try {
      const result = yield* call.next(call.request, _context);
      logger.info({ ...meta, durationMs: Date.now() - start }, 'gRPC completed');
      return result;
    } catch (error) {
      logger.error({ ...meta, durationMs: Date.now() - start, err: error }, 'gRPC failed');
      throw error;
    }
  };
}
