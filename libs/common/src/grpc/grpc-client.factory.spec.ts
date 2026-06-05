import { ClientError, Status } from 'nice-grpc';
import { callGrpc } from './grpc-status.util';
import { wrapNiceGrpcClient } from './grpc-client.factory';

describe('wrapNiceGrpcClient', () => {
  it('passes through successful RPC results', async () => {
    const inner = {
      login: jest.fn().mockResolvedValue({ accessToken: 'a' }),
      channel: {},
    };
    const client = wrapNiceGrpcClient(inner);

    await expect(client.login({ email: 'x', password: 'y' })).resolves.toEqual({
      accessToken: 'a',
    });
    expect(inner.login).toHaveBeenCalledWith({ email: 'x', password: 'y' });
  });

  it('maps ClientError to the HTTP error envelope', async () => {
    const inner = {
      login: jest.fn().mockRejectedValue(
        new ClientError('/auth.AuthService/Login', Status.UNAUTHENTICATED, 'Bad credentials'),
      ),
    };
    const client = wrapNiceGrpcClient(inner);

    await expect(client.login({ email: 'x', password: 'y' })).resolves.toEqual({
      statusCode: 401,
      message: 'Bad credentials',
      data: null,
    });
  });

  it('sanitizes infrastructure ClientError details', async () => {
    const inner = {
      login: jest.fn().mockRejectedValue(
        new ClientError(
          '/auth.AuthService/Login',
          Status.UNAVAILABLE,
          '14 UNAVAILABLE: connect ECONNREFUSED ::1:3001',
        ),
      ),
    };
    const client = wrapNiceGrpcClient(inner);

    await expect(client.login({ email: 'x', password: 'y' })).resolves.toEqual({
      statusCode: 503,
      message: 'Service temporarily unavailable',
      data: null,
    });
  });

  it('rethrows non-ClientError failures', async () => {
    const inner = {
      login: jest.fn().mockRejectedValue(new Error('network down')),
    };
    const client = wrapNiceGrpcClient(inner);

    await expect(client.login({ email: 'x', password: 'y' })).rejects.toThrow('network down');
  });

  it('passes through non-function properties', () => {
    const inner = { serviceName: 'AuthService', login: jest.fn() };
    const client = wrapNiceGrpcClient(inner);

    expect(client.serviceName).toBe('AuthService');
  });
});

describe('callGrpc', () => {
  it('returns proto data on success', async () => {
    await expect(callGrpc(async () => ({ userId: '1' }))).resolves.toEqual({ userId: '1' });
  });
});
