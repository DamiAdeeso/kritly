import { INestApplication, INestApplicationContext, INestMicroservice } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

type NestApp = INestApplication | INestMicroservice | INestApplicationContext;

export function useAppLogger(app: NestApp): Logger {
  const logger = app.get(Logger);
  if ('useLogger' in app && typeof app.useLogger === 'function') {
    app.useLogger(logger);
  }
  return logger;
}
