import { Injectable } from '@nestjs/common';
import { CreatePresignedUploadRequest, PresignedUploadData } from '@kritly/common';
import { StorageService } from './storage.service';

@Injectable()
export class UploadService {
  constructor(private readonly storageService: StorageService) {}

  async createPresignedUpload(request: CreatePresignedUploadRequest): Promise<PresignedUploadData> {
    return this.storageService.createPresignedUpload(request);
  }
}
