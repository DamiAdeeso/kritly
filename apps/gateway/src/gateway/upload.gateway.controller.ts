import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
  ValidationPipe,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  CreatePresignedUploadDto,
  CreatePresignedUploadResponse,
  CreatePresignedUploadResponseDto,
  GrpcErrorResponse,
  UploadGrpcErrorResponse,
} from '@kritly/common';
import { AuthClientService } from '../services/auth-client.service';
import { UploadClientService } from '../services/upload-client.service';

@ApiTags('Uploads')
@Controller('api/uploads')
export class UploadGatewayController {
  constructor(
    private readonly authClient: AuthClientService,
    private readonly uploadClient: UploadClientService,
  ) {}

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('presign')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a presigned upload URL for direct-to-storage upload' })
  @ApiBearerAuth()
  @ApiBody({ type: CreatePresignedUploadDto })
  @ApiResponse({
    status: 201,
    description: 'Presigned upload URL created',
    type: CreatePresignedUploadResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createPresignedUpload(
    @Headers('authorization') authHeader: string | undefined,
    @Body(ValidationPipe) dto: CreatePresignedUploadDto,
  ): Promise<CreatePresignedUploadResponse | UploadGrpcErrorResponse | GrpcErrorResponse> {
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    const validation = await this.authClient.validateToken({ accessToken: token });
    if (validation.statusCode !== 200 || !validation.data?.isValid || !validation.data.userId) {
      throw new UnauthorizedException('Invalid token');
    }

    return this.uploadClient.createPresignedUpload({
      userId: validation.data.userId,
      purpose: dto.purpose,
      contentType: dto.contentType,
      fileName: dto.fileName,
    });
  }
}
