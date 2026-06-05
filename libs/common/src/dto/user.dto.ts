import { IsOptional, IsString } from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { ProfileData } from '../generated/profile';
import type { UpdateProfileRequest } from '../generated/user';

import { ApiResponseDto } from './common.dto';



export class UpdateProfileDto implements Pick<UpdateProfileRequest, 'displayName' | 'bio'> {

  @ApiProperty({ description: 'Display name', example: 'John Doe' })

  @IsString()

  displayName!: string;



  @ApiProperty({ description: 'Profile bio', example: 'Building cool things.', required: false })

  @IsOptional()

  @IsString()

  bio?: string;

}



/** Profile payload (gRPC ProfileData; HTTP clients receive this inside ProfileResponseDto.data). */

export class ProfileDataDto implements ProfileData {

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })

  @IsString()

  userId!: string;



  @ApiPropertyOptional({ example: 'johndoe123' })

  @IsOptional()

  @IsString()

  username?: string;



  @ApiPropertyOptional({ example: 'John Doe' })

  @IsOptional()

  @IsString()

  displayName?: string;



  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })

  @IsOptional()

  @IsString()

  avatar?: string;



  @ApiPropertyOptional({ example: 'user@example.com' })

  @IsOptional()

  @IsString()

  email?: string;



  @ApiPropertyOptional({ example: 'Building cool things.' })

  @IsOptional()

  @IsString()

  bio?: string;

}



export class ProfileResponseDto extends ApiResponseDto<ProfileDataDto> {

  @ApiProperty({ type: () => ProfileDataDto })

  declare data: ProfileDataDto;

}

