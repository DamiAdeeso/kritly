import { UnauthorizedException } from '@nestjs/common';
import { ServerError, Status } from 'nice-grpc';
import { runGrpcHandler, wrapGrpcImplementation } from './grpc-server.util';

describe('grpc-server.util', () => {
  it('wrapGrpcImplementation propagates native ServerError', async () => {
    const implementation = wrapGrpcImplementation({
      async login() {
        throw new UnauthorizedException('Invalid credentials');
      },
    });

    await expect(implementation.login({}, {})).rejects.toMatchObject({
      code: Status.UNAUTHENTICATED,
      details: 'Invalid credentials',
    });
  });

  it('rethrows existing ServerError unchanged', async () => {
    const original = new ServerError(Status.NOT_FOUND, 'Not found');
    await expect(
      runGrpcHandler(async () => {
        throw original;
      }),
    ).rejects.toBe(original);
  });

  it('runGrpcHandler passes through successful responses', async () => {
    await expect(
      runGrpcHandler(async () => ({
        userId: 'user-1',
        email: 'user@example.com',
      })),
    ).resolves.toEqual({
      userId: 'user-1',
      email: 'user@example.com',
    });
  });
});
