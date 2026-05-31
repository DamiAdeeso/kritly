import type {
  CreatePresignedUploadRequest,
  CreatePresignedUploadResponse,
} from '../generated/upload';
import type { ServiceResponse } from '../dto/common.dto';

export type {
  CreatePresignedUploadRequest,
  CreatePresignedUploadResponse,
  PresignedUploadData,
} from '../generated/upload';

export const UPLOAD_SERVICE_NAME = 'UploadService';

/** Application-level gRPC error envelope (same shape as success responses) */
export type UploadGrpcErrorResponse = ServiceResponse<null>;

/** Nest ClientGrpc.getService('UploadService') contract */
export interface UploadServiceClient {
  createPresignedUpload(
    request: CreatePresignedUploadRequest,
  ): Promise<CreatePresignedUploadResponse>;
}

export type UploadGrpcClient = UploadServiceClient;
