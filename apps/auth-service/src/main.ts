import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { GRPC_PROTO_LOADER_OPTIONS, useAppLogger } from '@kritly/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const grpcPort = process.env.AUTH_SERVICE_PORT || '3001';

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    bufferLogs: true,
    transport: Transport.GRPC,
    options: {
      package: ['auth', 'user', 'grpc.health.v1'],
      protoPath: [
        join(process.cwd(), 'libs/common/src/proto/auth.proto'),
        join(process.cwd(), 'libs/common/src/proto/user.proto'),
        join(process.cwd(), 'libs/common/src/proto/health.proto'),
      ],
      url: `0.0.0.0:${grpcPort}`,
      loader: GRPC_PROTO_LOADER_OPTIONS,
    },
  });
  const logger = useAppLogger(app);
  app.flushLogs();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen();

  logger.log(`Auth service (gRPC) listening on 0.0.0.0:${grpcPort}`);
}

bootstrap();
