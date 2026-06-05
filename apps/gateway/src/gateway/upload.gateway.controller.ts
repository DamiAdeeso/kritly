import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
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
  CreatePresignedUploadResponseDto,
  HttpClientErrorResponse,
  PresignedUploadData,
  ServiceResponse,
  mapGrpcToHttp,
  ApiEnvelopeErrors,
} from '@kritly/common';
import { UploadClientService } from '../services/upload-client.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtUser } from '../auth/jwt-user.interface';

@ApiTags('Uploads')
@ApiEnvelopeErrors(400, 401, 403, 429, 500)
@Controller('api/uploads')
export class UploadGatewayController {
  constructor(private readonly uploadClient: UploadClientService) {}

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('presign')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a presigned upload URL for direct-to-storage upload' })
  @ApiBearerAuth()
  @ApiBody({ type: CreatePresignedUploadDto })
  @ApiResponse({
    status: 201,
    description: 'Presigned upload URL created',
    type: CreatePresignedUploadResponseDto,
  })
  async createPresignedUpload(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreatePresignedUploadDto,
  ): Promise<ServiceResponse<PresignedUploadData> | HttpClientErrorResponse> {
    return mapGrpcToHttp(
      await this.uploadClient.createPresignedUpload({
        userId: user.userId,
        purpose: dto.purpose,
        contentType: dto.contentType,
        fileName: dto.fileName,
        fileSize: dto.fileSize,
      }),
      'Presigned upload URL created',
      201,
    );
  }
}
