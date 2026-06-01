import { of } from 'rxjs';
import { grpcClientCall, resolveGrpcMethod } from './grpc-client.util';

describe('grpc-client.util', () => {
  it('unwraps observables', async () => {
    await expect(grpcClientCall(of({ statusCode: 200 }))).resolves.toEqual({ statusCode: 200 });
  });

  it('passes through plain values', async () => {
    await expect(grpcClientCall({ statusCode: 200 })).resolves.toEqual({ statusCode: 200 });
  });

  it('unwraps nested promises from typed grpc stubs', async () => {
    await expect(grpcClientCall(Promise.resolve({ statusCode: 200 }))).resolves.toEqual({
      statusCode: 200,
    });
  });

  it('resolves grpc method by alternate names', async () => {
    const service = {
      CheckEmailAvailability: jest.fn().mockReturnValue(of({ statusCode: 200 })),
    };

    const method = resolveGrpcMethod<(req: { email: string }) => ReturnType<typeof of>>(
      service,
      'checkEmailAvailability',
      'CheckEmailAvailability',
    );
    await expect(grpcClientCall(method({ email: 'user@example.com' }))).resolves.toEqual({
      statusCode: 200,
    });
    expect(service.CheckEmailAvailability).toHaveBeenCalledWith({ email: 'user@example.com' });
  });
});
