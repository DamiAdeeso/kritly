import { Injectable, UnauthorizedException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuthProvider as PrismaAuthProvider } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import {
  AuthProvider,
  AuthData,
  EmailAvailabilityData,
  Empty,
  ISocialProfile,
  LoginRequest,
  LoginSessionData,
  RefreshTokenRequest,
  RegisterInput,
  SocialLoginRequest,
  AUTH_CONSTANTS,
  DOMAIN_EVENTS,
  EventPublisher,
  RedisService,
  hashSubject,
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
import { toProfileDataFromUser } from '../mappers/user-profile.mapper';

@Injectable()
export class AuthService {
  constructor(
    @InjectPinoLogger(AuthService.name) private readonly logger: PinoLogger,
    private readonly accountRepository: AccountRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly socialAccountRepository: SocialAccountRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly tokenService: TokenService,
    private readonly googleAuthService: GoogleAuthService,
    private readonly facebookAuthService: FacebookAuthService,
    private readonly appleAuthService: AppleAuthService,
    private readonly instagramAuthService: InstagramAuthService,
    private readonly redisService: RedisService,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async checkEmailAvailability(email: string): Promise<EmailAvailabilityData> {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await this.accountRepository.findByEmail(normalizedEmail);
    const isAvailable = !existingUser;

    this.logger.debug({ isAvailable }, 'checkEmailAvailability');

    return { isAvailable };
  }

  async register(input: RegisterInput): Promise<AuthData> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const username = input.username?.trim() || normalizedEmail.split('@')[0];

    const existingUser = await this.accountRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const existingUsername = await this.profileRepository.findByUsername(username);
    if (existingUsername) {
      throw new BadRequestException('Username is already taken');
    }

    const hashedPassword = await bcrypt.hash(input.password, AUTH_CONSTANTS.SALT_ROUNDS);
    const dateOfBirth = this.parseDateOfBirth(input.dateOfBirth);

    const user = await this.accountRepository.create(
      toPrismaCreateUserInput({
        email: normalizedEmail,
        username,
        dateOfBirth,
        password: hashedPassword,
      }),
    );

    const tokens = await this.tokenService.generateTokens(user.id, user.email, user.role);

    this.logger.info(
      { userId: user.id, emailHash: hashSubject(user.email), username },
      'user registered',
    );

    try {
      this.eventPublisher.publish(
        DOMAIN_EVENTS.USER_REGISTERED,
        {
          userId: user.id,
          email: user.email,
          displayName: user.displayName ?? user.username ?? user.email.split('@')[0],
        },
        { idempotencyKey: `register:${user.id}` },
      );
    } catch {
      // Never block registration on notification failures
    }

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: user.id,
      email: user.email,
    };
  }

  async login(request: LoginRequest): Promise<AuthData> {
    const user = await this.authenticateForLogin(request.email, request.password);
    const tokens = await this.tokenService.generateTokens(user.id, user.email, user.role);

    this.logger.info({ userId: user.id, emailHash: hashSubject(user.email) }, 'login successful');

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: user.id,
      email: user.email,
    };
  }

  async loginSession(request: LoginRequest): Promise<LoginSessionData> {
    const user = await this.authenticateForLogin(request.email, request.password);
    const tokens = await this.tokenService.generateTokens(user.id, user.email, user.role);

    this.logger.info(
      {
        userId: user.id,
        emailHash: hashSubject(user.email),
        hasUsername: Boolean(user.username),
      },
      'login session successful',
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      profile: toProfileDataFromUser(user),
    };
  }

  async socialLogin(request: SocialLoginRequest): Promise<AuthData> {
    const provider = this.resolveAuthProvider(request.provider);
    const socialProfile = await this.verifySocialProfile(request, provider);

    let user = await this.accountRepository.findBySocialAccount(
      provider as unknown as PrismaAuthProvider,
      socialProfile.providerId,
    );

    if (user) {
      const tokens = await this.tokenService.generateTokens(user.id, user.email, user.role);
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        userId: user.id,
        email: user.email,
      };
    }

    user = await this.accountRepository.findByEmail(socialProfile.email);
    if (user) {
      await this.socialAccountRepository.create({
        provider: provider as unknown as PrismaAuthProvider,
        providerId: socialProfile.providerId,
        userId: user.id,
      });

      const tokens = await this.tokenService.generateTokens(user.id, user.email, user.role);
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        userId: user.id,
        email: user.email,
      };
    }

    user = await this.accountRepository.create(
      toPrismaCreateUserInput({
        email: socialProfile.email,
        displayName: socialProfile.displayName,
        avatar: socialProfile.avatar,
      }),
    );

    await this.socialAccountRepository.create({
      provider: provider as unknown as PrismaAuthProvider,
      providerId: socialProfile.providerId,
      userId: user.id,
    });

    const tokens = await this.tokenService.generateTokens(user.id, user.email, user.role);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: user.id,
      email: user.email,
    };
  }

  async refreshToken(request: RefreshTokenRequest): Promise<AuthData> {
    const refreshToken = await this.refreshTokenRepository.findByToken(request.refreshToken);
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (refreshToken.expiresAt < new Date()) {
      await this.refreshTokenRepository.delete(request.refreshToken);
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.accountRepository.findById(refreshToken.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.refreshTokenRepository.delete(request.refreshToken);

    const tokens = await this.tokenService.generateTokens(user.id, user.email, user.role);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: user.id,
      email: user.email,
    };
  }

  async logout(refreshToken: string): Promise<Empty> {
    await this.refreshTokenRepository.delete(refreshToken);
    return {};
  }

  async resetPassword(email: string, newPassword: string): Promise<Empty> {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.accountRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new BadRequestException('Unable to reset password for this account');
    }

    const hashedPassword = await bcrypt.hash(newPassword, AUTH_CONSTANTS.SALT_ROUNDS);
    await this.accountRepository.updatePassword(user.id, hashedPassword);
    await this.refreshTokenRepository.deleteByUserId(user.id);

    return {};
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<Empty> {
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

    return {};
  }

  private async authenticateForLogin(email: string, password: string) {
    const emailHash = hashSubject(email);
    await this.assertLoginNotLocked(email);

    const user = await this.accountRepository.findByEmail(email);
    if (!user) {
      await this.recordLoginFailedAttempt(email);
      this.logger.warn({ emailHash }, 'login failed: user not found');
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password || '');
    if (!isPasswordValid) {
      await this.recordLoginFailedAttempt(email);
      this.logger.warn({ emailHash, userId: user.id }, 'login failed: invalid password');
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.clearLoginAttempts(email);

    return user;
  }

  private resolveAuthProvider(provider: string): AuthProvider {
    const normalized = provider.toLowerCase();
    const match = Object.values(AuthProvider).find((value) => value === normalized);
    if (!match || match === AuthProvider.EMAIL) {
      throw new BadRequestException(`Unsupported social provider: ${provider}`);
    }
    return match;
  }

  private async verifySocialProfile(
    request: SocialLoginRequest,
    provider: AuthProvider,
  ): Promise<ISocialProfile> {
    switch (provider) {
      case AuthProvider.GOOGLE: {
        const idToken = request.idToken ?? request.accessToken;
        if (!idToken) {
          throw new BadRequestException('idToken is required for Google login');
        }
        return this.googleAuthService.verifyIdToken(idToken);
      }
      case AuthProvider.APPLE: {
        if (request.idToken) {
          return this.appleAuthService.verifyIdToken(request.idToken);
        }

        const authorizationCode = request.authorizationCode ?? request.accessToken;
        if (!authorizationCode) {
          throw new BadRequestException(
            'idToken or authorizationCode is required for Apple login',
          );
        }

        return this.appleAuthService.exchangeAuthorizationCode(authorizationCode);
      }
      case AuthProvider.FACEBOOK: {
        if (!request.accessToken) {
          throw new BadRequestException('accessToken is required for Facebook login');
        }
        return this.facebookAuthService.verifyAccessToken(request.accessToken);
      }
      case AuthProvider.INSTAGRAM: {
        if (!request.accessToken) {
          throw new BadRequestException('accessToken is required for Instagram login');
        }
        return this.instagramAuthService.verifyAccessToken(request.accessToken);
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
