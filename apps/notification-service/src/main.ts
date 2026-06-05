import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { useAppLogger } from '@kritly/common';
import { AppModule } from './app.module';
import rabbitmqConfig from './config/rabbitmq.config';

async function bootstrap(): Promise<void> {
  const { url: rabbitUrl, queue } = rabbitmqConfig();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      bufferLogs: true,
      transport: Transport.RMQ,
      options: {
        urls: [rabbitUrl],
        queue,
        queueOptions: { durable: true },
        noAck: false,
        prefetchCount: 10,
      },
    },
  );
  const logger = useAppLogger(app);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableShutdownHooks();
  app.flushLogs();

  await app.listen();

  const grpcPort =
    process.env.NOTIFICATION_SERVICE_PORT ??
    process.env.NOTIFICATION_SERVICE_GRPC_PORT ??
    '3003';
  logger.log(`Notification service (RMQ) listening on queue "${queue}"`);
  logger.log(`Notification service (gRPC) on port ${grpcPort}`);
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'unknown';
  // eslint-disable-next-line no-console
  console.error(`Notification service failed to start: ${message}`);
  process.exit(1);
});
