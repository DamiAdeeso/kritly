import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { REDIS_MODULE_OPTIONS, RedisModuleOptions } from './redis.constants';
import { RedisService } from './redis.service';

@Module({})
export class RedisModule {
  static register(options: RedisModuleOptions = {}): DynamicModule {
    return {
      module: RedisModule,
      global: true,
      imports: [ConfigModule],
      providers: [
        {
          provide: REDIS_MODULE_OPTIONS,
          useValue: options,
        },
        RedisService,
      ],
      exports: [RedisService],
    };
  }
}
