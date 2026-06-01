import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { CreatePresignedUploadRequest } from '@kritly/common';
import { UploadService } from './upload.service';

@Controller()
export class UploadGrpcController {
  constructor(private readonly uploadService: UploadService) {}

  @GrpcMethod('UploadService', 'CreatePresignedUpload')
  createPresignedUpload(data: CreatePresignedUploadRequest) {
    return this.uploadService.createPresignedUpload(data);
  }
}
