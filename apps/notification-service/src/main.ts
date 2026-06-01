import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { GRPC_PROTO_LOADER_OPTIONS, useAppLogger } from '@kritly/common';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://kritly:kritly@localhost:5672';
  const queue = process.env.RABBITMQ_NOTIFICATION_QUEUE || 'notification-service.send';
  const grpcPort = process.env.NOTIFICATION_SERVICE_GRPC_PORT || '3003';

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = useAppLogger(app);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitUrl],
      queue,
      queueOptions: { durable: true },
      noAck: false,
      prefetchCount: 10,
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: ['verification', 'grpc.health.v1'],
      protoPath: [
        join(process.cwd(), 'libs/common/src/proto/verification.proto'),
        join(process.cwd(), 'libs/common/src/proto/health.proto'),
      ],
      url: `0.0.0.0:${grpcPort}`,
      loader: GRPC_PROTO_LOADER_OPTIONS,
    },
  });

  app.flushLogs();

  await app.init();
  await app.startAllMicroservices();

  logger.log(`Notification service (RMQ) listening on queue "${queue}"`);
  logger.log(`Verification service (gRPC) listening on 0.0.0.0:${grpcPort}`);
}

bootstrap();
