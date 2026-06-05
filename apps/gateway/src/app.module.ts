import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppLoggerModule, rootEnvConfig } from '@kritly/common';
import { GatewayModule } from './gateway/gateway.module';
import { HttpEnvelopeExceptionFilter } from './filters/http-envelope.exception-filter';
import { ServiceResponseInterceptor } from './interceptors/service-response.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot(rootEnvConfig()),
    AppLoggerModule.register({ service: 'gateway', enableHttpLogging: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 60,
      },
    ]),
    GatewayModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpEnvelopeExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ServiceResponseInterceptor,
    },
  ],
})
export class AppModule {}
