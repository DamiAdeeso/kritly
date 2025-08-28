import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { RegisterDto, LoginDto, SocialLoginDto, RefreshTokenDto, LogoutDto } from '@rev/common';

@Injectable()
export class AuthGrpcService {
  constructor(private readonly authService: AuthService) {}

  async register(data: any) {
    try {
      const registerDto = new RegisterDto();
      registerDto.email = data.email;
      registerDto.password = data.password;
      registerDto.firstName = data.firstName;
      registerDto.lastName = data.lastName;
      registerDto.avatar = data.avatar;

      const result = await this.authService.register(registerDto);
      return result;
    } catch (error) {
      return {
        message: error.message || 'Registration failed',
        data: null,
        statusCode: error.status || 500,
      };
    }
  }

  async login(data: any) {
    try {
      const loginDto = new LoginDto();
      loginDto.email = data.email;
      loginDto.password = data.password;

      const result = await this.authService.login(loginDto);
      return result;
    } catch (error) {
      return {
        message: error.message || 'Login failed',
        data: null,
        statusCode: error.status || 500,
      };
    }
  }

  async socialLogin(data: any) {
    try {
      const socialLoginDto = new SocialLoginDto();
      socialLoginDto.provider = data.provider;
      socialLoginDto.accessToken = data.accessToken;
      socialLoginDto.email = data.email;
      socialLoginDto.firstName = data.firstName;
      socialLoginDto.lastName = data.lastName;
      socialLoginDto.avatar = data.avatar;

      const result = await this.authService.socialLogin(socialLoginDto);
      return result;
    } catch (error) {
      return {
        message: error.message || 'Social login failed',
        data: null,
        statusCode: error.status || 500,
      };
    }
  }

  async refreshToken(data: any) {
    try {
      const refreshTokenDto = new RefreshTokenDto();
      refreshTokenDto.refreshToken = data.refreshToken;

      const result = await this.authService.refreshToken(refreshTokenDto);
      return result;
    } catch (error) {
      return {
        message: error.message || 'Token refresh failed',
        data: null,
        statusCode: error.status || 500,
      };
    }
  }

  async logout(data: any) {
    try {
      await this.authService.logout(data.refreshToken);
      return {
        message: 'Logout successful',
        statusCode: 200,
      };
    } catch (error) {
      return {
        message: error.message || 'Logout failed',
        statusCode: error.status || 500,
      };
    }
  }

  async validateToken(data: any) {
    try {
      const result = await this.authService.validateToken(data.accessToken);
      return {
        isValid: result.isValid,
        userId: result.userId || '',
        email: result.email || '',
        message: result.message || 'Token validation successful',
        statusCode: result.statusCode || 200,
      };
    } catch (error) {
      return {
        isValid: false,
        userId: '',
        email: '',
        message: error.message || 'Token validation failed',
        statusCode: error.status || 500,
      };
    }
  }
}
