import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  GrpcServerRunner,
  HealthDefinition,
  HealthGrpcImplementation,
  isGrpcTlsEnabled,
  readGrpcTlsEnvFromGetter,
  VerificationServiceDefinition,
} from '@kritly/common';
import { VerificationGrpcImplementation } from '../verification/verification.grpc.implementation';

@Injectable()
export class NotificationGrpcServerService implements OnModuleInit, OnModuleDestroy {
  private readonly runner = new GrpcServerRunner();

  constructor(
    private readonly configService: ConfigService,
    private readonly verificationGrpc: VerificationGrpcImplementation,
    private readonly healthGrpc: HealthGrpcImplementation,
    @InjectPinoLogger(NotificationGrpcServerService.name) private readonly logger: PinoLogger,
  ) {}

  async onModuleInit(): Promise<void> {
    this.runner.enableLogging(this.logger);
    this.runner.add({
      definition: VerificationServiceDefinition,
      implementation: this.verificationGrpc,
    });
    this.runner.add({ definition: HealthDefinition, implementation: this.healthGrpc });

    const port =
      this.configService.get<string>('NOTIFICATION_SERVICE_PORT') ??
      this.configService.get<string>('NOTIFICATION_SERVICE_GRPC_PORT') ??
      '3003';
    const tlsConfig = readGrpcTlsEnvFromGetter((key) => this.configService.get<string>(key));
    const useTls = isGrpcTlsEnabled(tlsConfig);
    await this.runner.listen('0.0.0.0', port, useTls, tlsConfig);
    this.logger.info(
      `Verification service (gRPC) listening on 0.0.0.0:${port}${useTls ? ' (TLS)' : ''}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.runner.shutdown();
  }
}
