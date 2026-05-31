import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { CreatePresignedUploadRequest } from '@kritly/common';
import { UploadGrpcService } from './upload.grpc.service';

@Controller()
export class UploadGrpcController {
  constructor(private readonly uploadGrpcService: UploadGrpcService) {}

  @GrpcMethod('UploadService', 'CreatePresignedUpload')
  createPresignedUpload(data: CreatePresignedUploadRequest) {
    return this.uploadGrpcService.createPresignedUpload(data);
  }
}
