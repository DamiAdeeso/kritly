import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppLoggerModule, GrpcServiceResponseExceptionFilter, rootEnvConfig } from '@kritly/common';
import storageConfig from './config/storage.config';
import { UploadModule } from './upload/upload.module';
import { HealthGrpcController } from './health/health.grpc.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      ...rootEnvConfig(),
      load: [storageConfig],
    }),
    AppLoggerModule.register({ service: 'upload-service', enableHttpLogging: false }),
    UploadModule,
  ],
  controllers: [HealthGrpcController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GrpcServiceResponseExceptionFilter,
    },
  ],
})
export class AppModule {}
