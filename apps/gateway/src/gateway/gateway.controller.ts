import { 
  Controller, 
  Post, 
  Body, 
  HttpCode, 
  HttpStatus,
  Get,
  Headers,
  ValidationPipe,
  UseGuards
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiBody 
} from '@nestjs/swagger';
import { AuthClientService } from '../services/auth-client.service';
import { 
  LoginDto, 
  RegisterDto, 
  SocialLoginDto, 
  RefreshTokenDto, 
  LogoutDto,
  AuthResponseDto,
  CheckUsernameDto,
  UsernameAvailabilityResponseDto,
  SetUsernameDto,
  SetUsernameResponseDto,
  UpdateDisplayNameDto,
  UpdateAvatarDto,
  UpdateProfileResponseDto
} from '@rev/common';

@ApiTags('Gateway')
@Controller('api')
export class GatewayController {
  constructor(private readonly authClientService: AuthClientService) {}

  @Post('auth/register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ 
    status: 201, 
    description: 'User registered successfully',
    type: AuthResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(@Body(ValidationPipe) registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authClientService.register(registerDto);
  }

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    type: AuthResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body(ValidationPipe) loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authClientService.login(loginDto);
  }

  @Post('auth/social-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with social provider' })
  @ApiBody({ type: SocialLoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Social login successful',
    type: AuthResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async socialLogin(@Body(ValidationPipe) socialLoginDto: SocialLoginDto): Promise<AuthResponseDto> {
    return this.authClientService.socialLogin(socialLoginDto);
  }

  @Post('auth/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Token refreshed successfully',
    type: AuthResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async refreshToken(@Body(ValidationPipe) refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authClientService.refreshToken(refreshTokenDto);
  }

  @Post('auth/logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiBody({ type: LogoutDto })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Body(ValidationPipe) logoutDto: LogoutDto): Promise<void> {
    return this.authClientService.logout(logoutDto);
  }

  @Get('auth/validate')
  @ApiOperation({ summary: 'Validate access token' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async validateToken(@Headers('authorization') authHeader: string): Promise<any> {
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      throw new Error('No token provided');
    }
    return this.authClientService.validateToken({ accessToken: token });
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Gateway is healthy' })
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('auth/check-username')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check username availability' })
  @ApiBody({ type: CheckUsernameDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Username availability checked',
    type: UsernameAvailabilityResponseDto 
  })
  async checkUsername(@Body(ValidationPipe) checkUsernameDto: CheckUsernameDto): Promise<UsernameAvailabilityResponseDto> {
    return this.authClientService.checkUsername(checkUsernameDto);
  }

  @Post('auth/set-username')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set username for user' })
  @ApiBody({ type: SetUsernameDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Username set successfully',
    type: SetUsernameResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Username already taken' })
  async setUsername(@Body(ValidationPipe) setUsernameDto: SetUsernameDto): Promise<SetUsernameResponseDto> {
    return this.authClientService.setUsername(setUsernameDto);
  }

  @Post('auth/update-display-name')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user display name' })
  @ApiBody({ type: UpdateDisplayNameDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Display name updated successfully',
    type: UpdateProfileResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateDisplayName(@Body(ValidationPipe) updateDisplayNameDto: UpdateDisplayNameDto): Promise<UpdateProfileResponseDto> {
    return this.authClientService.updateDisplayName(updateDisplayNameDto);
  }

  @Post('auth/update-avatar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user avatar URL' })
  @ApiBody({ type: UpdateAvatarDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Avatar updated successfully',
    type: UpdateProfileResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateAvatar(@Body(ValidationPipe) updateAvatarDto: UpdateAvatarDto): Promise<UpdateProfileResponseDto> {
    return this.authClientService.updateAvatar(updateAvatarDto);
  }
}
