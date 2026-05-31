import { Injectable } from '@nestjs/common';
import {
  CreatePresignedUploadRequest,
  CreatePresignedUploadResponse,
  fail,
  UploadGrpcErrorResponse,
} from '@kritly/common';
import { UploadService } from './upload.service';
import { getErrorMessage, getErrorStatus } from './grpc-error.util';

@Injectable()
export class UploadGrpcService {
  constructor(private readonly uploadService: UploadService) {}

  async createPresignedUpload(
    data: CreatePresignedUploadRequest,
  ): Promise<CreatePresignedUploadResponse | UploadGrpcErrorResponse> {
    try {
      return await this.uploadService.createPresignedUpload(data);
    } catch (error: unknown) {
      return fail(getErrorMessage(error, 'Presigned upload creation failed'), getErrorStatus(error));
    }
  }
}
