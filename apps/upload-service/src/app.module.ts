import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from '@kritly/common';
import storageConfig from './config/storage.config';
import { UploadModule } from './upload/upload.module';
import { HealthGrpcController } from './health/health.grpc.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: [`.env.${process.env.NODE_ENV || 'local'}`, '.env.local', '.env'],
      load: [storageConfig],
    }),
    UploadModule,
  ],
  controllers: [HealthGrpcController],
})
export class AppModule {}
