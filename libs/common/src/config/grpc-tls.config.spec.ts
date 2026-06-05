import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { getGrpcServerCredentials } from '../grpc/grpc-server-credentials.util';
import { getGrpcCredentials } from '../grpc/grpc-credentials.util';
import { resolveGrpcTlsMaterial } from './grpc-tls.config';

describe('grpc TLS config', () => {
  it('resolveGrpcTlsMaterial throws when cert paths are missing', () => {
    expect(() => resolveGrpcTlsMaterial({ GRPC_USE_TLS: 'true' })).toThrow(/GRPC_TLS_CERT/);
  });

  it('resolveGrpcTlsMaterial throws when files are missing', () => {
    expect(() =>
      resolveGrpcTlsMaterial({
        GRPC_TLS_CERT: '/nonexistent/server.pem',
        GRPC_TLS_KEY: '/nonexistent/server.key',
      }),
    ).toThrow(/GRPC_TLS_CERT file not found/);
  });

  it('loads server credentials from cert and key PEM files', () => {
    const dir = mkdtempSync(join(tmpdir(), 'kritly-grpc-tls-'));
    const certPath = join(dir, 'server.pem');
    const keyPath = join(dir, 'server.key');
    const pem = '-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----\n';
    const key = '-----BEGIN PRIVATE KEY-----\nMIIE\n-----END PRIVATE KEY-----\n';
    writeFileSync(certPath, pem);
    writeFileSync(keyPath, key);

    const config = { GRPC_TLS_CERT: certPath, GRPC_TLS_KEY: keyPath };

    expect(() => getGrpcServerCredentials(true, config)).not.toThrow();
  });

  it('loads client credentials with CA only', () => {
    const dir = mkdtempSync(join(tmpdir(), 'kritly-grpc-tls-'));
    const caPath = join(dir, 'ca.pem');
    writeFileSync(caPath, '-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----\n');

    expect(() => getGrpcCredentials(true, { GRPC_TLS_CA: caPath })).not.toThrow();
  });

  it('loads client credentials with system roots when only GRPC_USE_TLS is set', () => {
    expect(() => getGrpcCredentials(true, { GRPC_USE_TLS: 'true' })).not.toThrow();
  });

  it('returns insecure credentials when TLS is disabled', () => {
    expect(getGrpcServerCredentials(false)).toBeDefined();
    expect(getGrpcCredentials(false)).toBeDefined();
  });
});
