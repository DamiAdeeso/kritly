import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  AuthServiceDefinition,
  GrpcServerRunner,
  HealthDefinition,
  HealthGrpcImplementation,
  isGrpcTlsEnabled,
  readGrpcTlsEnvFromGetter,
  UserServiceDefinition,
} from '@kritly/common';
import { AuthGrpcImplementation } from '../auth/auth.grpc.implementation';
import { UserGrpcImplementation } from '../user/user.grpc.implementation';

@Injectable()
export class AuthGrpcServerService implements OnModuleInit, OnModuleDestroy {
  private readonly runner = new GrpcServerRunner();

  constructor(
    private readonly configService: ConfigService,
    private readonly authGrpc: AuthGrpcImplementation,
    private readonly userGrpc: UserGrpcImplementation,
    private readonly healthGrpc: HealthGrpcImplementation,
    @InjectPinoLogger(AuthGrpcServerService.name) private readonly logger: PinoLogger,
  ) {}

  async onModuleInit(): Promise<void> {
    this.runner.enableLogging(this.logger);
    this.runner.add({ definition: AuthServiceDefinition, implementation: this.authGrpc });
    this.runner.add({ definition: UserServiceDefinition, implementation: this.userGrpc });
    this.runner.add({ definition: HealthDefinition, implementation: this.healthGrpc });

    const port = this.configService.get<string>('AUTH_SERVICE_PORT') ?? '3001';
    const tlsConfig = readGrpcTlsEnvFromGetter((key) => this.configService.get<string>(key));
    const useTls = isGrpcTlsEnabled(tlsConfig);
    await this.runner.listen('0.0.0.0', port, useTls, tlsConfig);
    this.logger.info(
      `Auth service (gRPC) listening on 0.0.0.0:${port}${useTls ? ' (TLS)' : ''}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.runner.shutdown();
  }
}
