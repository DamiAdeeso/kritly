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
    const existingUser = await this.userRepository.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, AUTH_CONSTANTS.SALT_ROUNDS);

    const user = await this.userRepository.create({
      email: registerDto.email,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      password: hashedPassword,
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: user.id,
      email: user.email,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findByEmail(loginDto.email);
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: user.id,
      email: user.email,
    };
  }

  async socialLogin(socialLoginDto: SocialLoginDto): Promise<AuthResponseDto> {
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
        throw new BadRequestException('Unsupported provider');
    }

    // Check if user exists with this social account
    let user = await this.userRepository.findBySocialProvider(
      socialLoginDto.provider,
      socialProfile.providerId
    );

    if (!user) {
      // Check if user exists with the same email
      user = await this.userRepository.findByEmail(socialProfile.email);
      
      if (user) {
        // Link existing user with social account
        await this.socialAccountRepository.create({
          provider: socialLoginDto.provider,
          providerId: socialProfile.providerId,
          userId: user.id,
        });
      } else {
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
      }
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: user.id,
      email: user.email,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    const refreshToken = await this.refreshTokenRepository.findByToken(refreshTokenDto.refreshToken);
    
    if (!refreshToken || refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userRepository.findById(refreshToken.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Delete the used refresh token
    await this.refreshTokenRepository.deleteByToken(refreshTokenDto.refreshToken);

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: user.id,
      email: user.email,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokenRepository.deleteByToken(refreshToken);
  }

  async validateToken(token: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { userId, email, role };
    
    const accessToken = this.jwtService.sign(payload, {
      secret: AUTH_CONSTANTS.JWT_SECRET,
      expiresIn: AUTH_CONSTANTS.JWT_EXPIRES_IN,
    });

    const refreshToken = this.jwtService.sign(
      { userId, tokenId: Date.now().toString() },
      {
        secret: AUTH_CONSTANTS.JWT_SECRET,
        expiresIn: AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRES_IN,
      }
    );

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.refreshTokenRepository.create({
      token: refreshToken,
      userId,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }
}
