import './load-env';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const grpcPort = process.env.AUTH_SERVICE_PORT || '3001';

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: ['auth', 'user', 'grpc.health.v1'],
      protoPath: [
        join(process.cwd(), 'libs/common/src/proto/auth.proto'),
        join(process.cwd(), 'libs/common/src/proto/user.proto'),
        join(process.cwd(), 'libs/common/src/proto/health.proto'),
      ],
      url: `0.0.0.0:${grpcPort}`,
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen();

  console.log(`Auth Service (gRPC) listening on 0.0.0.0:${grpcPort}`);
}

bootstrap();
