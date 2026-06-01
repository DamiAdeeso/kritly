import { DynamicModule, Module } from '@nestjs/common';
import { LoggerModule, Params } from 'nestjs-pino';
import { createPinoParams } from './create-pino-params';
import { AppLoggerOptions } from './logger.constants';

@Module({})
export class AppLoggerModule {
  static register(options: AppLoggerOptions): DynamicModule {
    return {
      module: AppLoggerModule,
      global: true,
      imports: [LoggerModule.forRoot(createPinoParams(options) as Params)],
      exports: [LoggerModule],
    };
  }
}
