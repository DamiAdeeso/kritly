import { Injectable, UnauthorizedException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuthProvider as PrismaAuthProvider } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import {
  LoginDto,
  RegisterDto,
  SocialLoginDto,
  RefreshTokenDto,
  AuthProvider,
  AuthServiceResponse,
  LogoutServiceResponse,
  ValidateTokenServiceResponse,
  UpdateProfileServiceResponse,
  EmailAvailabilityServiceResponse,
  ISocialProfile,
  AUTH_CONSTANTS,
  DOMAIN_EVENTS,
  EventPublisher,
  ok,
  okEmpty,
  RedisService,
} from '@kritly/common';
import { AccountRepository } from '../repositories/account.repository';
import { ProfileRepository } from '../repositories/profile.repository';
import { SocialAccountRepository, RefreshTokenRepository } from '../repositories';
import { TokenService } from '../shared/token.service';
import { GoogleAuthService } from './strategies/google-auth.service';
import { FacebookAuthService } from './strategies/facebook-auth.service';
import { AppleAuthService } from './strategies/apple-auth.service';
import { InstagramAuthService } from './strategies/instagram-auth.service';
import { toPrismaCreateUserInput } from '../mappers/user-prisma.mapper';

@Injectable()
export class AuthService {
  constructor(
    @InjectPinoLogger(AuthService.name) private readonly logger: PinoLogger,
    private readonly accountRepository: AccountRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly socialAccountRepository: SocialAccountRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly tokenService: TokenService,
    private readonly jwtService: JwtService,
    private readonly googleAuthService: GoogleAuthService,
    private readonly facebookAuthService: FacebookAuthService,
    private readonly appleAuthService: AppleAuthService,
    private readonly instagramAuthService: InstagramAuthService,
    private readonly redisService: RedisService,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async checkEmailAvailability(email: string): Promise<EmailAvailabilityServiceResponse> {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await this.accountRepository.findByEmail(normalizedEmail);
    const isAvailable = !existingUser;

    this.logger.info(
      {
        email: normalizedEmail,
        isAvailable,
        existingUserId: existingUser?.id ?? null,
      },
      'checkEmailAvailability',
    );

    return ok(isAvailable ? 'Email is available' : 'Email is already registered', { isAvailable });
  }

  async register(registerDto: RegisterDto): Promise<AuthServiceResponse> {
    const normalizedEmail = registerDto.email.trim().toLowerCase();

    const existingUser = await this.accountRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const existingUsername = await this.profileRepository.findByUsername(registerDto.username);
    if (existingUsername) {
      throw new BadRequestException('Username is already taken');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, AUTH_CONSTANTS.SALT_ROUNDS);
    const dateOfBirth = this.parseDateOfBirth(registerDto.dateOfBirth);

    const user = await this.accountRepository.create(
      toPrismaCreateUserInput({
        email: normalizedEmail,
        username: registerDto.username,
        dateOfBirth,
        password: hashedPassword,
      }),
    );

    const tokens = await this.tokenService.generateTokens(user.id, user.email, user.role);

    try {
      this.eventPublisher.publish(
        DOMAIN_EVENTS.USER_REGISTERED,
        {
          userId: user.id,
          email: user.email,
          firstName: user.username ?? user.email.split('@')[0],
        },
        { idempotencyKey: `register:${user.id}` },
      );
    } catch {
      // Never block registration on notification failures
    }

    return ok(
      'User registered successfully',
      {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        userId: user.id,
        email: user.email,
      },
      201,
    );
  }

  async login(loginDto: LoginDto): Promise<AuthServiceResponse> {
    await this.assertLoginNotLocked(loginDto.email);

    const user = await this.accountRepository.findByEmail(loginDto.email);
    if (!user) {
      await this.recordLoginFailedAttempt(loginDto.email);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password || '');
    if (!isPasswordValid) {
      await this.recordLoginFailedAttempt(loginDto.email);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.clearLoginAttempts(loginDto.email);

    const tokens = await this.tokenService.generateTokens(user.id, user.email, user.role);

    return ok('Login successful', {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: user.id,
      email: user.email,
    });
  }

  async socialLogin(socialLoginDto: SocialLoginDto): Promise<AuthServiceResponse> {
    const socialProfile = await this.verifySocialProfile(socialLoginDto);

    let user = await this.accountRepository.findBySocialAccount(
      socialLoginDto.provider as unknown as PrismaAuthProvider,
      socialProfile.providerId,
    );

    if (user) {
      const tokens = await this.tokenService.generateTokens(user.id, user.email, user.role);
      return ok('Social login successful', {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        userId: user.id,
        email: user.email,
      });
    }

    user = await this.accountRepository.findByEmail(socialProfile.email);
    if (user) {
      await this.socialAccountRepository.create({
        provider: socialLoginDto.provider as unknown as PrismaAuthProvider,
        providerId: socialProfile.providerId,
        userId: user.id,
      });

      const tokens = await this.tokenService.generateTokens(user.id, user.email, user.role);
      return ok('Social login successful', {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        userId: user.id,
        email: user.email,
      });
    }

    user = await this.accountRepository.create(
      toPrismaCreateUserInput({
        email: socialProfile.email,
        firstName: socialProfile.firstName,
        lastName: socialProfile.lastName,
        avatar: socialProfile.avatar,
      }),
    );

    await this.socialAccountRepository.create({
      provider: socialLoginDto.provider as unknown as PrismaAuthProvider,
      providerId: socialProfile.providerId,
      userId: user.id,
    });

    const tokens = await this.tokenService.generateTokens(user.id, user.email, user.role);
    return ok(
      'Social login successful',
      {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        userId: user.id,
        email: user.email,
      },
      201,
    );
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthServiceResponse> {
    const refreshToken = await this.refreshTokenRepository.findByToken(refreshTokenDto.refreshToken);
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (refreshToken.expiresAt < new Date()) {
      await this.refreshTokenRepository.delete(refreshTokenDto.refreshToken);
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.accountRepository.findById(refreshToken.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.refreshTokenRepository.delete(refreshTokenDto.refreshToken);

    const tokens = await this.tokenService.generateTokens(user.id, user.email, user.role);

    return ok('Token refreshed successfully', {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: user.id,
      email: user.email,
    });
  }

  async logout(refreshToken: string): Promise<LogoutServiceResponse> {
    await this.refreshTokenRepository.delete(refreshToken);
    return okEmpty('Logout successful');
  }

  async validateToken(token: string): Promise<ValidateTokenServiceResponse> {
    try {
      const payload = this.jwtService.verify<Record<string, unknown>>(token);
      return ok('Token validation successful', {
        isValid: true,
        userId: String(payload.sub ?? ''),
        email: String(payload.email ?? ''),
      });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async resetPassword(email: string, newPassword: string): Promise<UpdateProfileServiceResponse> {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.accountRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new BadRequestException('Unable to reset password for this account');
    }

    const hashedPassword = await bcrypt.hash(newPassword, AUTH_CONSTANTS.SALT_ROUNDS);
    await this.accountRepository.updatePassword(user.id, hashedPassword);
    await this.refreshTokenRepository.deleteByUserId(user.id);

    return okEmpty('Password reset successfully');
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<UpdateProfileServiceResponse> {
    if (currentPassword === newPassword) {
      throw new BadRequestException('New password must be different from your current password');
    }

    const user = await this.accountRepository.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.password) {
      throw new BadRequestException('Password login is not enabled for this account');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, AUTH_CONSTANTS.SALT_ROUNDS);
    await this.accountRepository.updatePassword(userId, hashedPassword);
    await this.refreshTokenRepository.deleteByUserId(userId);

    return okEmpty('Password changed successfully');
  }

  private async verifySocialProfile(socialLoginDto: SocialLoginDto): Promise<ISocialProfile> {
    switch (socialLoginDto.provider) {
      case AuthProvider.GOOGLE: {
        const idToken = socialLoginDto.idToken ?? socialLoginDto.accessToken;
        if (!idToken) {
          throw new BadRequestException('idToken is required for Google login');
        }
        return this.googleAuthService.verifyIdToken(idToken);
      }
      case AuthProvider.APPLE: {
        if (socialLoginDto.idToken) {
          return this.appleAuthService.verifyIdToken(socialLoginDto.idToken);
        }

        const authorizationCode =
          socialLoginDto.authorizationCode ?? socialLoginDto.accessToken;
        if (!authorizationCode) {
          throw new BadRequestException(
            'idToken or authorizationCode is required for Apple login',
          );
        }

        return this.appleAuthService.exchangeAuthorizationCode(authorizationCode);
      }
      case AuthProvider.FACEBOOK: {
        if (!socialLoginDto.accessToken) {
          throw new BadRequestException('accessToken is required for Facebook login');
        }
        return this.facebookAuthService.verifyAccessToken(socialLoginDto.accessToken);
      }
      case AuthProvider.INSTAGRAM: {
        if (!socialLoginDto.accessToken) {
          throw new BadRequestException('accessToken is required for Instagram login');
        }
        return this.instagramAuthService.verifyAccessToken(socialLoginDto.accessToken);
      }
      default:
        throw new BadRequestException('Unsupported social provider');
    }
  }

  private getLoginAttemptsKey(email: string): string {
    return `login:attempts:${email.toLowerCase()}`;
  }

  private async assertLoginNotLocked(email: string): Promise<void> {
    const attempts = await this.redisService.get(this.getLoginAttemptsKey(email));
    if (attempts && Number.parseInt(attempts, 10) >= AUTH_CONSTANTS.MAX_LOGIN_ATTEMPTS) {
      throw new HttpException(
        'Too many login attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async recordLoginFailedAttempt(email: string): Promise<void> {
    await this.redisService.increment(
      this.getLoginAttemptsKey(email),
      AUTH_CONSTANTS.LOCKOUT_DURATION / 1000,
    );
  }

  private async clearLoginAttempts(email: string): Promise<void> {
    await this.redisService.delete(this.getLoginAttemptsKey(email));
  }

  private parseDateOfBirth(value: string): Date {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date of birth');
    }
    return date;
  }
}
