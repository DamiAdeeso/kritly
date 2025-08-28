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
  AuthResponseDto 
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
}
