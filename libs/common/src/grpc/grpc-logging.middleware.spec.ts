import { createGrpcLoggingMiddleware } from './grpc-logging.middleware';

async function runMiddleware(
  middleware: ReturnType<typeof createGrpcLoggingMiddleware>,
  call: { method: { path: string }; request: unknown; next: jest.Mock },
): Promise<unknown> {
  const gen = middleware(call as never, {} as never);
  let result = await gen.next();
  while (!result.done) {
    result = await gen.next(result.value as undefined);
  }
  return result.value;
}

describe('createGrpcLoggingMiddleware', () => {
  it('skips logging for gRPC health check RPCs', async () => {
    const logger = { info: jest.fn(), error: jest.fn() };
    const middleware = createGrpcLoggingMiddleware(logger);

    await runMiddleware(middleware, {
      method: { path: '/grpc.health.v1.Health/Check' },
      request: {},
      next: jest.fn(async function* () {
        return { status: 'SERVING' };
      }),
    });

    expect(logger.info).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs non-health RPC completion', async () => {
    const logger = { info: jest.fn(), error: jest.fn() };
    const middleware = createGrpcLoggingMiddleware(logger);

    await runMiddleware(middleware, {
      method: { path: '/auth.AuthService/Login' },
      request: {},
      next: jest.fn(async function* () {
        return { accessToken: 'a' };
      }),
    });

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ method: '/auth.AuthService/Login', durationMs: expect.any(Number) }),
      'gRPC completed',
    );
  });
});
