import './load-env';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://kritly:kritly@localhost:5672';
  const queue = process.env.RABBITMQ_NOTIFICATION_QUEUE || 'notification-service.send';
  const grpcPort = process.env.NOTIFICATION_SERVICE_GRPC_PORT || '3003';

  const app = await NestFactory.create(AppModule);

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
    },
  });

  await app.init();
  await app.startAllMicroservices();

  console.log(`Notification Service (RMQ) listening on queue "${queue}"`);
  console.log(`Verification Service (gRPC) listening on 0.0.0.0:${grpcPort}`);
}

bootstrap();
