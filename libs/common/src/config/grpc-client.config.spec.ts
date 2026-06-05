import { resolveGrpcServiceEndpoint, isGrpcTlsEnabled } from './grpc-client.config';

describe('grpc-client.config', () => {
  it('uses defaults when env vars are missing', () => {
    expect(resolveGrpcServiceEndpoint({}, 'auth')).toEqual({
      host: 'localhost',
      port: '3001',
    });
    expect(resolveGrpcServiceEndpoint({}, 'upload')).toEqual({
      host: 'localhost',
      port: '3002',
    });
    expect(resolveGrpcServiceEndpoint({}, 'notification')).toEqual({
      host: 'localhost',
      port: '3003',
    });
  });

  it('prefers configured host and port', () => {
    expect(
      resolveGrpcServiceEndpoint(
        {
          AUTH_SERVICE_HOST: 'auth.internal',
          AUTH_SERVICE_PORT: '5001',
        },
        'auth',
      ),
    ).toEqual({
      host: 'auth.internal',
      port: '5001',
    });
  });

  it('detects TLS from GRPC_USE_TLS', () => {
    expect(isGrpcTlsEnabled({ GRPC_USE_TLS: 'true' })).toBe(true);
    expect(isGrpcTlsEnabled({ GRPC_USE_TLS: 'false' })).toBe(false);
    expect(isGrpcTlsEnabled({})).toBe(false);
  });
});
