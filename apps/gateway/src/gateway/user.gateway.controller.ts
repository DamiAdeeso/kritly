import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Headers,
  Req,
  UseGuards,
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
import { VerificationGuard } from '../guards/verification.guard';
import {
  CheckUsernameDto,
  UsernameAvailabilityResponseDto,
  SetUsernameDto,
  SetUsernameResponseDto,
  UpdateAvatarDto,
  UpdateProfileResponseDto,
  GrpcErrorResponse,
  UpdateProfileResponse,
  UsernameAvailabilityResponse,
  ProfileResponse,
  RequiresVerification,
  OtpPurpose,
  SetUsernameResponse,
  UserGrpcErrorResponse,
} from '@kritly/common';

interface VerifiedRequest {
  verifiedUser?: { userId: string; email: string };
}

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
  @UseGuards(VerificationGuard)
  @RequiresVerification(OtpPurpose.SENSITIVE_ACTION)
  @ApiOperation({ summary: 'Set or change username (requires OTP verification)' })
  @ApiBearerAuth()
  @ApiHeader({
    name: 'x-verification-token',
    required: true,
    description: 'Short-lived token from POST /api/verification/verify',
  })
  @ApiBody({ type: SetUsernameDto })
  @ApiResponse({ status: 200, description: 'Username set successfully', type: SetUsernameResponseDto })
  async setUsername(
    @Req() request: VerifiedRequest,
    @Body(ValidationPipe) dto: SetUsernameDto,
  ): Promise<SetUsernameResponse | UserGrpcErrorResponse | GrpcErrorResponse> {
    if (!request.verifiedUser?.userId) {
      throw new UnauthorizedException('Invalid token');
    }

    return this.userClient.setUsername({
      userId: request.verifiedUser.userId,
      username: dto.username,
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
