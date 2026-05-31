import { Injectable } from '@nestjs/common';
import {
  CreatePresignedUploadRequest,
  ok,
  PresignedUploadData,
  ServiceResponse,
} from '@kritly/common';
import { StorageService } from './storage.service';

export type CreatePresignedUploadServiceResponse = ServiceResponse<PresignedUploadData>;

@Injectable()
export class UploadService {
  constructor(private readonly storageService: StorageService) {}

  async createPresignedUpload(
    request: CreatePresignedUploadRequest,
  ): Promise<CreatePresignedUploadServiceResponse> {
    const result = await this.storageService.createPresignedUpload(request);

    return ok('Presigned upload URL created', result, 201);
  }
}
