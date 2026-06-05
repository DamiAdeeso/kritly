import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  EventPublisherModule,
  HealthGrpcImplementation,
  RedisModule,
  AppLoggerModule,
  rootEnvConfig,
} from '@kritly/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AuthGrpcServerService } from './grpc/auth-grpc-server.service';
import redisConfig from './config/redis.config';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      ...rootEnvConfig(),
      load: [redisConfig],
    }),
    AppLoggerModule.register({ service: 'auth-service', enableHttpLogging: false }),
    PrismaModule,
    EventPublisherModule.register({ source: 'auth-service' }),
    RedisModule.register({ unavailableMessage: 'Login lockout is disabled.' }),
    AuthModule,
    UserModule,
  ],
  providers: [AuthGrpcServerService, HealthGrpcImplementation],
})
export class AppModule {}
