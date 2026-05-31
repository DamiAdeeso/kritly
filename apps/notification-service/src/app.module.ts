import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from '@kritly/common';
import notificationConfig from './config/notification.config';
import rabbitmqConfig from './config/rabbitmq.config';
import redisConfig from './config/redis.config';
import smtpConfig from './config/smtp.config';
import verificationConfig from './config/verification.config';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { TemplatesModule } from './templates/templates.module';
import { VerificationModule } from './verification/verification.module';
import { HealthGrpcController } from './health/health.grpc.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: [`.env.${process.env.NODE_ENV || 'local'}`, '.env.local', '.env'],
      load: [smtpConfig, rabbitmqConfig, redisConfig, notificationConfig, verificationConfig],
    }),
    PrismaModule,
    RedisModule,
    TemplatesModule,
    NotificationsModule,
    VerificationModule,
  ],
  controllers: [HealthGrpcController],
})
export class AppModule {}
