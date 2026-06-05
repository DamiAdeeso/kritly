import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  EventPublisherModule,
  HealthGrpcImplementation,
  RedisModule,
  AppLoggerModule,
  rootEnvConfig,
} from '@kritly/common';
import notificationConfig from './config/notification.config';
import rabbitmqConfig from './config/rabbitmq.config';
import redisConfig from './config/redis.config';
import smtpConfig from './config/smtp.config';
import verificationConfig from './config/verification.config';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { TemplatesModule } from './templates/templates.module';
import { VerificationModule } from './verification/verification.module';
import { NotificationGrpcServerService } from './grpc/notification-grpc-server.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      ...rootEnvConfig(),
      load: [smtpConfig, rabbitmqConfig, redisConfig, notificationConfig, verificationConfig],
    }),
    AppLoggerModule.register({ service: 'notification-service', enableHttpLogging: false }),
    EventPublisherModule.register({ source: 'notification-service' }),
    PrismaModule,
    RedisModule.register({
      keyPrefix: 'notification:',
      unavailableMessage: 'Template cache and OTP storage are disabled.',
    }),
    TemplatesModule,
    NotificationsModule,
    VerificationModule,
  ],
  providers: [NotificationGrpcServerService, HealthGrpcImplementation],
})
export class AppModule {}
