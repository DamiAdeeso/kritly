import type { ChannelCredentials } from '@grpc/grpc-js';
import { createChannel, createClient, Channel, CompatServiceDefinition } from 'nice-grpc';
import { callGrpc } from './grpc-status.util';

/** Build a host:port address for gRPC clients. */
export function grpcServiceAddress(host: string, port: string | number): string {
  return `${host}:${port}`;
}

export interface NiceGrpcConnection<TClient> {
  client: TClient;
  channel: Channel;
}

/** Connect a ts-proto nice-grpc client to a remote service. */
export function connectNiceGrpcClient<TClient extends object>(
  definition: CompatServiceDefinition,
  host: string,
  port: string | number,
  credentials: ChannelCredentials,
): NiceGrpcConnection<TClient> {
  const channel = createChannel(grpcServiceAddress(host, port), credentials);
  const client = wrapNiceGrpcClient(createClient(definition, channel) as TClient);
  return { client, channel };
}

/**
 * Wrap each client RPC so {@link ClientError} becomes the gateway HTTP error envelope.
 * gRPC success still returns proto data only; the envelope is applied in gateway controllers.
 */
export function wrapNiceGrpcClient<TClient extends object>(client: TClient): TClient {
  return new Proxy(client, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== 'function') {
        return value;
      }

      return (...args: unknown[]) =>
        callGrpc(() => (value as (...a: unknown[]) => Promise<unknown>).apply(target, args));
    },
  });
}
