import {
  Controller,
  Post,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserClientService } from '../services/user-client.service';
import {
  CheckUsernameDto,
  UsernameAvailabilityResponseDto,
  SetUsernameDto,
  SetUsernameResponseDto,
  UpdateAvatarDto,
  UpdateProfileDto,
  EmptyDataDto,
  AuthData,
  ProfileResponseDto,
  EmptySuccessResponseDto,
  HttpClientErrorResponse,
  ServiceResponse,
  ProfileData,
  UsernameAvailabilityData,
  mapGrpcToHttp,
  mapGrpcEmptyToHttp,
  mapAvailabilityToHttp,
  ApiEnvelopeErrors,
  PROFILE_CONSTANTS,
} from '@kritly/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtUser } from '../auth/jwt-user.interface';

@ApiTags('Users')
@ApiEnvelopeErrors(400, 401, 403, 404, 429, 500)
@Controller('api/users')
export class UserGatewayController {
  constructor(private readonly userClient: UserClientService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Profile retrieved', type: ProfileResponseDto })
  async getMyProfile(
    @CurrentUser() user: JwtUser,
  ): Promise<ServiceResponse<ProfileData> | HttpClientErrorResponse> {
    return mapGrpcToHttp(
      await this.userClient.getProfile({ userId: user.userId }),
      'Profile retrieved successfully',
    );
  }

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Get('by-username/:username')
  @ApiOperation({ summary: 'Get a public profile by username' })
  @ApiParam({ name: 'username', example: 'johndoe123' })
  @ApiResponse({ status: 200, description: 'Profile retrieved', type: ProfileResponseDto })
  async getProfileByUsername(
    @Param('username') username: string,
  ): Promise<ServiceResponse<ProfileData> | HttpClientErrorResponse> {
    return mapGrpcToHttp(
      await this.userClient.getProfileByUsername({ username }),
      'Profile retrieved successfully',
    );
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('check-username')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check username availability' })
  @ApiBody({ type: CheckUsernameDto })
  @ApiResponse({ status: 200, description: 'Username availability checked', type: UsernameAvailabilityResponseDto })
  async checkUsername(
    @Body() dto: CheckUsernameDto,
  ): Promise<ServiceResponse<UsernameAvailabilityData> | HttpClientErrorResponse> {
    return mapAvailabilityToHttp(
      await this.userClient.checkUsername(dto),
      'Username is available',
      'Username is already taken',
    );
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('username')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: `Set or change username (limited to once every ${PROFILE_CONSTANTS.USERNAME_CHANGE_COOLDOWN_DAYS} days)`,
  })
  @ApiBearerAuth()
  @ApiBody({ type: SetUsernameDto })
  @ApiResponse({ status: 200, description: 'Username set successfully', type: SetUsernameResponseDto })
  async setUsername(
    @CurrentUser() user: JwtUser,
    @Body() dto: SetUsernameDto,
  ): Promise<ServiceResponse<AuthData> | HttpClientErrorResponse> {
    return mapGrpcToHttp(
      await this.userClient.setUsername({
        userId: user.userId,
        username: dto.username,
      }),
      'Username set successfully',
    );
  }

  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update user avatar URL' })
  @ApiBearerAuth()
  @ApiBody({ type: UpdateAvatarDto })
  @ApiResponse({ status: 200, description: 'Avatar updated successfully', type: EmptySuccessResponseDto })
  async updateAvatar(
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateAvatarDto,
  ): Promise<ServiceResponse<EmptyDataDto> | HttpClientErrorResponse> {
    return mapGrpcEmptyToHttp(
      await this.userClient.updateAvatar({
        userId: user.userId,
        avatar: dto.avatar,
      }),
      'Avatar updated successfully',
    );
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update profile (display name, bio)' })
  @ApiBearerAuth()
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully', type: EmptySuccessResponseDto })
  async updateProfile(
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<ServiceResponse<EmptyDataDto> | HttpClientErrorResponse> {
    return mapGrpcEmptyToHttp(
      await this.userClient.updateProfile({
        userId: user.userId,
        displayName: dto.displayName,
        bio: dto.bio,
      }),
      'Profile updated successfully',
    );
  }
}
