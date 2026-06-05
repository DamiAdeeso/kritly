import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadGrpcImplementation } from './upload.grpc.implementation';
import { StorageService } from './storage.service';

@Module({
  providers: [UploadService, UploadGrpcImplementation, StorageService],
  exports: [UploadService, UploadGrpcImplementation],
})
export class UploadModule {}
