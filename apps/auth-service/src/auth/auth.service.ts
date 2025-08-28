import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import {
  LoginDto,
  RegisterDto,
  SocialLoginDto,
  RefreshTokenDto,
  AuthResponseDto,
  AuthProvider
} from '@rev/common';
import { UserRepository, SocialAccountRepository, RefreshTokenRepository } from '../repositories';
import { AUTH_CONSTANTS } from '@rev/common';
import { GoogleAuthService } from './strategies/google-auth.service';
import { FacebookAuthService } from './strategies/facebook-auth.service';
import { AppleAuthService } from './strategies/apple-auth.service';
import { InstagramAuthService } from './strategies/instagram-auth.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly socialAccountRepository: SocialAccountRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly googleAuthService: GoogleAuthService,
    private readonly facebookAuthService: FacebookAuthService,
    private readonly appleAuthService: AppleAuthService,
    private readonly instagramAuthService: InstagramAuthService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, AUTH_CONSTANTS.SALT_ROUNDS);

    // Create user
    const user = await this.userRepository.create({
      email: registerDto.email,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      password: hashedPassword,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      message: 'User registered successfully',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        userId: user.id,
        email: user.email,
      },
      statusCode: 201,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Find user by email
    const user = await this.userRepository.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password || '');
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      message: 'Login successful',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        userId: user.id,
        email: user.email,
      },
      statusCode: 200,
    };
  }

  async socialLogin(socialLoginDto: SocialLoginDto): Promise<AuthResponseDto> {
    // Verify social token and get user profile
    let socialProfile;
    switch (socialLoginDto.provider) {
      case AuthProvider.GOOGLE:
        socialProfile = await this.googleAuthService.verifyToken(socialLoginDto.accessToken);
        break;
      case AuthProvider.FACEBOOK:
        socialProfile = await this.facebookAuthService.verifyToken(socialLoginDto.accessToken);
        break;
      case AuthProvider.APPLE:
        socialProfile = await this.appleAuthService.verifyToken(socialLoginDto.accessToken);
        break;
      case AuthProvider.INSTAGRAM:
        socialProfile = await this.instagramAuthService.verifyToken(socialLoginDto.accessToken);
        break;
      default:
        throw new BadRequestException('Unsupported social provider');
    }

    // Check if user exists with this social account
    let user = await this.userRepository.findBySocialAccount(
      socialLoginDto.provider,
      socialProfile.providerId
    );

    if (user) {
      // User exists, generate tokens
      const tokens = await this.generateTokens(user.id, user.email, user.role);
      return {
        message: 'Social login successful',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          userId: user.id,
          email: user.email,
        },
        statusCode: 200,
      };
    }

    // Check if user exists with the same email
    user = await this.userRepository.findByEmail(socialProfile.email);
    if (user) {
      // Link existing user with social account
      await this.socialAccountRepository.create({
        provider: socialLoginDto.provider,
        providerId: socialProfile.providerId,
        userId: user.id,
      });

      const tokens = await this.generateTokens(user.id, user.email, user.role);
      return {
        message: 'Social login successful',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          userId: user.id,
          email: user.email,
        },
        statusCode: 200,
      };
    }

    // Create new user
    user = await this.userRepository.create({
      email: socialProfile.email,
      firstName: socialProfile.firstName,
      lastName: socialProfile.lastName,
      avatar: socialProfile.avatar,
    });

    // Create social account
    await this.socialAccountRepository.create({
      provider: socialLoginDto.provider,
      providerId: socialProfile.providerId,
      userId: user.id,
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return {
      message: 'Social login successful',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        userId: user.id,
        email: user.email,
      },
      statusCode: 201,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    // Find refresh token
    const refreshToken = await this.refreshTokenRepository.findByToken(refreshTokenDto.refreshToken);
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token is expired
    if (refreshToken.expiresAt < new Date()) {
      await this.refreshTokenRepository.delete(refreshTokenDto.refreshToken);
      throw new UnauthorizedException('Refresh token expired');
    }

    // Get user
    const user = await this.userRepository.findById(refreshToken.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Delete the used refresh token
    await this.refreshTokenRepository.delete(refreshTokenDto.refreshToken);

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      message: 'Token refreshed successfully',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        userId: user.id,
        email: user.email,
      },
      statusCode: 200,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokenRepository.delete(refreshToken);
  }

  async validateToken(token: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private async generateTokens(userId: string, email: string, role: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload = { sub: userId, email, role };
    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.generateRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.refreshTokenRepository.create({
      token: refreshToken,
      userId,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  private generateRefreshToken(): string {
    return require('crypto').randomBytes(64).toString('hex');
  }
}

