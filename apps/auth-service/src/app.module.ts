import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import {
  EventPublisherModule,
  GrpcServiceResponseExceptionFilter,
  RedisModule,
  AppLoggerModule,
  rootEnvConfig,
} from '@kritly/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { GrpcLoggingInterceptor } from './interceptors/grpc-logging.interceptor';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      ...rootEnvConfig(),
      load: [databaseConfig, redisConfig],
    }),
    AppLoggerModule.register({ service: 'auth-service', enableHttpLogging: false }),
    EventPublisherModule.register({ source: 'auth-service' }),
    RedisModule.register({ unavailableMessage: 'Login lockout is disabled.' }),
    AuthModule,
    UserModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GrpcServiceResponseExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: GrpcLoggingInterceptor,
    },
  ],
})
export class AppModule {}
