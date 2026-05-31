import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventPublisherModule, validateEnv } from '@kritly/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: [`.env.${process.env.NODE_ENV || 'local'}`, '.env.local', '.env'],
      load: [databaseConfig, redisConfig],
    }),
    EventPublisherModule.register({ source: 'auth-service' }),
    RedisModule,
    AuthModule,
    UserModule,
  ],
})
export class AppModule {}
