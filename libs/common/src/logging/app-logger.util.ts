import { INestApplication, INestMicroservice } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

type NestApp = INestApplication | INestMicroservice;

export function useAppLogger(app: NestApp): Logger {
  const logger = app.get(Logger);
  app.useLogger(logger);
  return logger;
}
