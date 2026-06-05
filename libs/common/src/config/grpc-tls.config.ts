import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

export interface GrpcTlsEnvConfig {
  GRPC_USE_TLS?: string;
  GRPC_TLS_CERT?: string;
  GRPC_TLS_KEY?: string;
  /** Optional CA bundle — clients use it to verify servers; servers use it for optional mTLS. */
  GRPC_TLS_CA?: string;
}

export interface GrpcTlsMaterial {
  certChain: Buffer;
  privateKey: Buffer;
  rootCerts: Buffer | null;
}

export function readGrpcTlsEnvFromProcess(): GrpcTlsEnvConfig {
  return readGrpcTlsEnvFromGetter((key) => process.env[key]);
}

export function readGrpcTlsEnvFromGetter(
  get: (key: string) => string | undefined,
): GrpcTlsEnvConfig {
  return {
    GRPC_USE_TLS: get('GRPC_USE_TLS'),
    GRPC_TLS_CERT: get('GRPC_TLS_CERT'),
    GRPC_TLS_KEY: get('GRPC_TLS_KEY'),
    GRPC_TLS_CA: get('GRPC_TLS_CA'),
  };
}

function readTlsFile(filePath: string, envName: string): Buffer {
  const resolved = resolve(filePath);
  if (!existsSync(resolved)) {
    throw new Error(`${envName} file not found: ${resolved}`);
  }
  return readFileSync(resolved);
}

/** Load PEM material required for gRPC TLS (server and/or client). */
export function resolveGrpcTlsMaterial(config: GrpcTlsEnvConfig): GrpcTlsMaterial {
  const certPath = config.GRPC_TLS_CERT?.trim();
  const keyPath = config.GRPC_TLS_KEY?.trim();

  if (!certPath || !keyPath) {
    throw new Error('GRPC_TLS_CERT and GRPC_TLS_KEY are required when GRPC_USE_TLS=true');
  }

  const certChain = readTlsFile(certPath, 'GRPC_TLS_CERT');
  const privateKey = readTlsFile(keyPath, 'GRPC_TLS_KEY');
  const caPath = config.GRPC_TLS_CA?.trim();
  const rootCerts = caPath ? readTlsFile(caPath, 'GRPC_TLS_CA') : null;

  return { certChain, privateKey, rootCerts };
}
