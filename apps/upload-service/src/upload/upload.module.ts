import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadGrpcService } from './upload.grpc.service';
import { UploadGrpcController } from './upload.grpc.controller';
import { StorageService } from './storage.service';

@Module({
  controllers: [UploadGrpcController],
  providers: [UploadService, UploadGrpcService, StorageService],
})
export class UploadModule {}
