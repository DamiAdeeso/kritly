import { createPinoParams } from './create-pino-params';

describe('createPinoParams', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalLogLevel = process.env.LOG_LEVEL;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.LOG_LEVEL = originalLogLevel;
  });

  it('enables HTTP logging for gateway-style services', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.LOG_LEVEL;

    const params = createPinoParams({ service: 'gateway', enableHttpLogging: true });

    expect(params.pinoHttp).toEqual(
      expect.objectContaining({
        level: 'info',
        base: { service: 'gateway', env: 'production' },
        autoLogging: expect.objectContaining({
          ignore: expect.any(Function),
        }),
      }),
    );

    const ignore = params.pinoHttp!.autoLogging.ignore;

    expect(ignore({ url: '/health' })).toBe(true);
    expect(ignore({ url: '/api/auth/login' })).toBe(false);
    expect(params.base).toEqual({ service: 'gateway', env: 'production' });
    expect(params.level).toBe('info');
  });

  it('disables HTTP logging for gRPC-only services', () => {
    process.env.NODE_ENV = 'local';
    delete process.env.LOG_LEVEL;

    const params = createPinoParams({ service: 'auth-service', enableHttpLogging: false });

    expect(params.pinoHttp).toBeUndefined();
    expect(params.base).toEqual({ service: 'auth-service', env: 'local' });
    expect(params.level).toBe('debug');
    expect(params.transport).toEqual(
      expect.objectContaining({
        target: 'pino-pretty',
      }),
    );
  });

  it('uses JSON logging without transport in production for gRPC-only services', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.LOG_LEVEL;

    const params = createPinoParams({ service: 'auth-service', enableHttpLogging: false });

    expect(params.pinoHttp).toBeUndefined();
    expect(params.transport).toBeUndefined();
    expect(params.level).toBe('info');
    expect(params.base).toEqual({ service: 'auth-service', env: 'production' });
  });

  it('redacts sensitive fields from logs', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.LOG_LEVEL;

    const params = createPinoParams({ service: 'gateway', enableHttpLogging: true });

    expect(params.redact).toEqual({
      paths: expect.arrayContaining([
        'req.headers.authorization',
        'req.headers.cookie',
        'password',
        'refreshToken',
        'accessToken',
        'idToken',
        'authorizationCode',
        'verificationToken',
      ]),
      censor: '[Redacted]',
    });
  });

  it('respects LOG_LEVEL when provided', () => {
    process.env.NODE_ENV = 'production';
    process.env.LOG_LEVEL = 'warn';

    const params = createPinoParams({ service: 'upload-service', enableHttpLogging: false });

    expect(params.level).toBe('warn');
  });
});
