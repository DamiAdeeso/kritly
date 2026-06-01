import { ChannelCredentials } from '@grpc/grpc-js';

export function getGrpcCredentials() {
  return process.env.GRPC_USE_TLS === 'true'
    ? ChannelCredentials.createSsl()
    : ChannelCredentials.createInsecure();
}
