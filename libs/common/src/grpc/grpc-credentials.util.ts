import { ChannelCredentials } from '@grpc/grpc-js';
import {
  GrpcTlsEnvConfig,
  readGrpcTlsEnvFromProcess,
  resolveGrpcTlsMaterial,
} from '../config/grpc-tls.config';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

/** Client channel credentials when `GRPC_USE_TLS=true`. */
export function getGrpcCredentials(
  useTls: boolean,
  config: GrpcTlsEnvConfig = readGrpcTlsEnvFromProcess(),
): ChannelCredentials {
  if (!useTls) {
    return ChannelCredentials.createInsecure();
  }

  const certPath = config.GRPC_TLS_CERT?.trim();
  const keyPath = config.GRPC_TLS_KEY?.trim();
  const caPath = config.GRPC_TLS_CA?.trim();

  if (certPath && keyPath) {
    const { rootCerts, certChain, privateKey } = resolveGrpcTlsMaterial(config);
    return ChannelCredentials.createSsl(rootCerts ?? undefined, privateKey, certChain);
  }

  if (caPath) {
    const resolved = resolve(caPath);
    if (!existsSync(resolved)) {
      throw new Error(`GRPC_TLS_CA file not found: ${resolved}`);
    }
    return ChannelCredentials.createSsl(readFileSync(resolved));
  }

  return ChannelCredentials.createSsl();
}
