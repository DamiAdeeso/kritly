import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppLoggerModule, HealthGrpcImplementation, rootEnvConfig } from '@kritly/common';
import storageConfig from './config/storage.config';
import { UploadModule } from './upload/upload.module';
import { UploadGrpcServerService } from './grpc/upload-grpc-server.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      ...rootEnvConfig(),
      load: [storageConfig],
    }),
    AppLoggerModule.register({ service: 'upload-service', enableHttpLogging: false }),
    UploadModule,
  ],
  providers: [UploadGrpcServerService, HealthGrpcImplementation],
})
export class AppModule {}
