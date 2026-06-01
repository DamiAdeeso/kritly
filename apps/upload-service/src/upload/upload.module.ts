import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadGrpcController } from './upload.grpc.controller';
import { StorageService } from './storage.service';

@Module({
  controllers: [UploadGrpcController],
  providers: [UploadService, StorageService],
})
export class UploadModule {}
