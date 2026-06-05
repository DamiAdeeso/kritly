export const GRPC_CLIENT_DEFAULTS = {
  auth: { host: 'localhost', port: '3001' },
  upload: { host: 'localhost', port: '3002' },
  notification: { host: 'localhost', port: '3003' },
} as const;

export type GrpcServiceName = keyof typeof GRPC_CLIENT_DEFAULTS;

export interface GrpcServiceEndpoint {
  host: string;
  port: string;
}

import type { GrpcTlsEnvConfig } from './grpc-tls.config';

export interface GrpcClientEnvConfig extends GrpcTlsEnvConfig {
  AUTH_SERVICE_HOST?: string;
  AUTH_SERVICE_PORT?: string;
  UPLOAD_SERVICE_HOST?: string;
  UPLOAD_SERVICE_PORT?: string;
  NOTIFICATION_SERVICE_HOST?: string;
  NOTIFICATION_SERVICE_GRPC_PORT?: string;
}

/** Resolve host/port for a downstream gRPC service from config or defaults. */
export function resolveGrpcServiceEndpoint(
  config: GrpcClientEnvConfig,
  service: GrpcServiceName,
): GrpcServiceEndpoint {
  switch (service) {
    case 'auth':
      return {
        host: config.AUTH_SERVICE_HOST ?? GRPC_CLIENT_DEFAULTS.auth.host,
        port: config.AUTH_SERVICE_PORT ?? GRPC_CLIENT_DEFAULTS.auth.port,
      };
    case 'upload':
      return {
        host: config.UPLOAD_SERVICE_HOST ?? GRPC_CLIENT_DEFAULTS.upload.host,
        port: config.UPLOAD_SERVICE_PORT ?? GRPC_CLIENT_DEFAULTS.upload.port,
      };
    case 'notification':
      return {
        host: config.NOTIFICATION_SERVICE_HOST ?? GRPC_CLIENT_DEFAULTS.notification.host,
        port: config.NOTIFICATION_SERVICE_GRPC_PORT ?? GRPC_CLIENT_DEFAULTS.notification.port,
      };
    default: {
      const _exhaustive: never = service;
      return _exhaustive;
    }
  }
}

export function isGrpcTlsEnabled(config: GrpcClientEnvConfig): boolean {
  return config.GRPC_USE_TLS === 'true';
}
