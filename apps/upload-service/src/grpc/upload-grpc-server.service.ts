import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  GrpcServerRunner,
  HealthDefinition,
  HealthGrpcImplementation,
  isGrpcTlsEnabled,
  readGrpcTlsEnvFromGetter,
  UploadServiceDefinition,
} from '@kritly/common';
import { UploadGrpcImplementation } from '../upload/upload.grpc.implementation';

@Injectable()
export class UploadGrpcServerService implements OnModuleInit, OnModuleDestroy {
  private readonly runner = new GrpcServerRunner();

  constructor(
    private readonly configService: ConfigService,
    private readonly uploadGrpc: UploadGrpcImplementation,
    private readonly healthGrpc: HealthGrpcImplementation,
    @InjectPinoLogger(UploadGrpcServerService.name) private readonly logger: PinoLogger,
  ) {}

  async onModuleInit(): Promise<void> {
    this.runner.enableLogging(this.logger);
    this.runner.add({ definition: UploadServiceDefinition, implementation: this.uploadGrpc });
    this.runner.add({ definition: HealthDefinition, implementation: this.healthGrpc });

    const port = this.configService.get<string>('UPLOAD_SERVICE_PORT') ?? '3002';
    const tlsConfig = readGrpcTlsEnvFromGetter((key) => this.configService.get<string>(key));
    const useTls = isGrpcTlsEnabled(tlsConfig);
    await this.runner.listen('0.0.0.0', port, useTls, tlsConfig);
    this.logger.info(
      `Upload service (gRPC) listening on 0.0.0.0:${port}${useTls ? ' (TLS)' : ''}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.runner.shutdown();
  }
}
