import {
  Controller,
  Post,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Headers,
  ValidationPipe,
  UnauthorizedException,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiParam,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthClientService } from '../services/auth-client.service';
import { UserClientService } from '../services/user-client.service';
import {
  CheckUsernameDto,
  UsernameAvailabilityResponseDto,
  SetUsernameDto,
  SetUsernameResponseDto,
  UpdateAvatarDto,
  UpdateProfileDto,
  UpdateProfileResponseDto,
  GrpcErrorResponse,
  UpdateProfileResponse,
  UsernameAvailabilityResponse,
  ProfileResponse,
  SetUsernameResponse,
  UserGrpcErrorResponse,
} from '@kritly/common';

@ApiTags('Users')
@Controller('api/users')
export class UserGatewayController {
  constructor(
    private readonly authClient: AuthClientService,
    private readonly userClient: UserClientService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Profile retrieved' })
  async getMyProfile(
    @Headers('authorization') authHeader: string | undefined,
  ): Promise<ProfileResponse | UserGrpcErrorResponse | GrpcErrorResponse> {
    const userId = await this.requireUserId(authHeader);
    return this.userClient.getProfile({ userId });
  }

  @Get('by-username/:username')
  @ApiOperation({ summary: 'Get a public profile by username' })
  @ApiParam({ name: 'username', example: 'johndoe123' })
  @ApiResponse({ status: 200, description: 'Profile retrieved' })
  async getProfileByUsername(
    @Param('username') username: string,
  ): Promise<ProfileResponse | UserGrpcErrorResponse | GrpcErrorResponse> {
    return this.userClient.getProfileByUsername({ username });
  }

  @Post('check-username')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check username availability' })
  @ApiBody({ type: CheckUsernameDto })
  @ApiResponse({ status: 200, description: 'Username availability checked', type: UsernameAvailabilityResponseDto })
  async checkUsername(
    @Body(ValidationPipe) dto: CheckUsernameDto,
  ): Promise<UsernameAvailabilityResponse | UserGrpcErrorResponse | GrpcErrorResponse> {
    return this.userClient.checkUsername(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('username')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set or change username (requires OTP verification)' })
  @ApiBearerAuth()
  @ApiHeader({
    name: 'x-verification-token',
    required: true,
    description: 'Short-lived token from POST /api/verification/verify',
  })
  @ApiBody({ type: SetUsernameDto })
  @ApiResponse({ status: 200, description: 'Username set successfully', type: SetUsernameResponseDto })
  @ApiResponse({ status: 403, description: 'Verification token required or invalid' })
  async setUsername(
    @Headers('authorization') authHeader: string | undefined,
    @Headers('x-verification-token') verificationToken: string | undefined,
    @Body(ValidationPipe) dto: SetUsernameDto,
  ): Promise<SetUsernameResponse | UserGrpcErrorResponse | GrpcErrorResponse> {
    const userId = await this.requireUserId(authHeader);

    return this.userClient.setUsername({
      userId,
      username: dto.username,
      verificationToken: verificationToken ?? '',
    });
  }

  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user avatar URL' })
  @ApiBearerAuth()
  @ApiBody({ type: UpdateAvatarDto })
  @ApiResponse({ status: 200, description: 'Avatar updated successfully', type: UpdateProfileResponseDto })
  async updateAvatar(
    @Headers('authorization') authHeader: string | undefined,
    @Body(ValidationPipe) dto: UpdateAvatarDto,
  ): Promise<UpdateProfileResponse | UserGrpcErrorResponse | GrpcErrorResponse> {
    const userId = await this.requireUserId(authHeader);
    return this.userClient.updateAvatar({
      userId,
      avatar: dto.avatar,
    });
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update profile (first name, last name, bio)' })
  @ApiBearerAuth()
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully', type: UpdateProfileResponseDto })
  async updateProfile(
    @Headers('authorization') authHeader: string | undefined,
    @Body(ValidationPipe) dto: UpdateProfileDto,
  ): Promise<UpdateProfileResponse | UserGrpcErrorResponse | GrpcErrorResponse> {
    const userId = await this.requireUserId(authHeader);
    return this.userClient.updateProfile({
      userId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      bio: dto.bio,
    });
  }

  private async requireUserId(authHeader: string | undefined): Promise<string> {
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    const validation = await this.authClient.validateToken({ accessToken: token });
    if (validation.statusCode !== 200 || !validation.data?.isValid || !validation.data.userId) {
      throw new UnauthorizedException('Invalid token');
    }

    return validation.data.userId;
  }
}
