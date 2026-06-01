import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { useAppLogger } from '@kritly/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const grpcPort = process.env.UPLOAD_SERVICE_PORT || '3002';

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    bufferLogs: true,
    transport: Transport.GRPC,
    options: {
      package: ['upload', 'grpc.health.v1'],
      protoPath: [
        join(process.cwd(), 'libs/common/src/proto/upload.proto'),
        join(process.cwd(), 'libs/common/src/proto/health.proto'),
      ],
      url: `0.0.0.0:${grpcPort}`,
    },
  });
  const logger = useAppLogger(app);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen();

  logger.log(`Upload service (gRPC) listening on 0.0.0.0:${grpcPort}`);
}

bootstrap();
