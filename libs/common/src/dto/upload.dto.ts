import { IsEnum, IsInt, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { PresignedUploadData } from '../generated/upload';
import { UploadPurpose } from '../constants/upload.constants';
import { ApiResponseDto } from './common.dto';

export class CreatePresignedUploadDto {
  @ApiProperty({
    description: 'Upload purpose — determines allowed mime types and storage path',
    enum: UploadPurpose,
    example: UploadPurpose.AVATAR,
  })
  @IsEnum(UploadPurpose)
  purpose!: UploadPurpose;

  @ApiProperty({ description: 'MIME type of the file to upload', example: 'image/jpeg' })
  @IsString()
  contentType!: string;

  @ApiProperty({ description: 'Original file name', example: 'profile.jpg' })
  @IsString()
  fileName!: string;

  @ApiProperty({ description: 'File size in bytes', example: 245_760 })
  @IsInt()
  @Min(1)
  fileSize!: number;
}

export class PresignedUploadDataDto implements PresignedUploadData {
  @ApiProperty({ description: 'Presigned PUT URL for direct upload to storage' })
  @IsString()
  uploadUrl!: string;

  @ApiProperty({ description: 'Object key in storage' })
  @IsString()
  fileKey!: string;

  @ApiProperty({ description: 'Public URL to use after upload completes' })
  @IsString()
  publicUrl!: string;

  @ApiProperty({ description: 'Unix timestamp (seconds) when the presigned URL expires' })
  expiresAt!: number;
}

export class CreatePresignedUploadResponseDto extends ApiResponseDto<PresignedUploadDataDto> {
  @ApiProperty({ type: () => PresignedUploadDataDto })
  declare data: PresignedUploadDataDto;
}
