import { NestFactory } from '@nestjs/core';
import { useAppLogger } from '@kritly/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: true,
  });
  const logger = useAppLogger(app);
  app.enableShutdownHooks();
  app.flushLogs();
  logger.log('Upload service started');
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'unknown';
  // eslint-disable-next-line no-console
  console.error(`Upload service failed to start: ${message}`);
  process.exit(1);
});
