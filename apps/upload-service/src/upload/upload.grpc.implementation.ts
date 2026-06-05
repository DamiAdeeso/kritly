import { Injectable } from '@nestjs/common';
import { CreatePresignedUploadRequest, UploadServiceImplementation } from '@kritly/common';
import { UploadService } from './upload.service';

@Injectable()
export class UploadGrpcImplementation implements UploadServiceImplementation {
  constructor(private readonly uploadService: UploadService) {}

  createPresignedUpload(request: CreatePresignedUploadRequest) {
    return this.uploadService.createPresignedUpload(request);
  }
}
