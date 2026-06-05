import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CompatServiceDefinition } from 'nice-grpc';
import {
  GrpcClientEnvConfig,
  GrpcServiceEndpoint,
  GrpcServiceName,
  isGrpcTlsEnabled,
  resolveGrpcServiceEndpoint,
} from '../config/grpc-client.config';
import { connectNiceGrpcClient, NiceGrpcConnection } from './grpc-client.factory';
import { getGrpcCredentials } from './grpc-credentials.util';

@Injectable()
export class GrpcClientConfigService {
  constructor(private readonly configService: ConfigService) {}

  getEndpoint(service: GrpcServiceName): GrpcServiceEndpoint {
    return resolveGrpcServiceEndpoint(this.readEnvConfig(), service);
  }

  /** Connect a ts-proto nice-grpc client using ConfigService-backed settings. */
  connect<TClient extends object>(
    definition: CompatServiceDefinition,
    service: GrpcServiceName,
  ): NiceGrpcConnection<TClient> {
    const { host, port } = this.getEndpoint(service);
    return connectNiceGrpcClient<TClient>(
      definition,
      host,
      port,
      getGrpcCredentials(isGrpcTlsEnabled(this.readEnvConfig()), this.readEnvConfig()),
    );
  }

  private readEnvConfig(): GrpcClientEnvConfig {
    return {
      AUTH_SERVICE_HOST: this.configService.get<string>('AUTH_SERVICE_HOST'),
      AUTH_SERVICE_PORT: this.configService.get<string>('AUTH_SERVICE_PORT'),
      UPLOAD_SERVICE_HOST: this.configService.get<string>('UPLOAD_SERVICE_HOST'),
      UPLOAD_SERVICE_PORT: this.configService.get<string>('UPLOAD_SERVICE_PORT'),
      NOTIFICATION_SERVICE_HOST: this.configService.get<string>('NOTIFICATION_SERVICE_HOST'),
      NOTIFICATION_SERVICE_GRPC_PORT: this.configService.get<string>('NOTIFICATION_SERVICE_GRPC_PORT'),
      GRPC_USE_TLS: this.configService.get<string>('GRPC_USE_TLS'),
      GRPC_TLS_CERT: this.configService.get<string>('GRPC_TLS_CERT'),
      GRPC_TLS_KEY: this.configService.get<string>('GRPC_TLS_KEY'),
      GRPC_TLS_CA: this.configService.get<string>('GRPC_TLS_CA'),
    };
  }
}
