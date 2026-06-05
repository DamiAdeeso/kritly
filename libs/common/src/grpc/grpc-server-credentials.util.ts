import { ServerCredentials } from '@grpc/grpc-js';
import {
  GrpcTlsEnvConfig,
  readGrpcTlsEnvFromProcess,
  resolveGrpcTlsMaterial,
} from '../config/grpc-tls.config';

/** Server credentials for nice-grpc listen(). */
export function getGrpcServerCredentials(
  useTls: boolean,
  config: GrpcTlsEnvConfig = readGrpcTlsEnvFromProcess(),
): ServerCredentials {
  if (!useTls) {
    return ServerCredentials.createInsecure();
  }

  const { certChain, privateKey, rootCerts } = resolveGrpcTlsMaterial(config);
  return ServerCredentials.createSsl(
    rootCerts,
    [{ cert_chain: certChain, private_key: privateKey }],
    Boolean(rootCerts),
  );
}
