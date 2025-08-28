import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGrpcService } from '../grpc/auth.grpc.service';
import { AuthGrpcController } from '../grpc/auth.grpc.controller';
import { HealthController } from '../health/health.controller';
import { UserRepository, SocialAccountRepository, RefreshTokenRepository } from '../repositories';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleAuthService } from './strategies/google-auth.service';
import { FacebookAuthService } from './strategies/facebook-auth.service';
import { AppleAuthService } from './strategies/apple-auth.service';
import { InstagramAuthService } from './strategies/instagram-auth.service';
import { AUTH_CONSTANTS } from '@rev/common';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || AUTH_CONSTANTS.JWT_SECRET,
        signOptions: {
          expiresIn: AUTH_CONSTANTS.JWT_EXPIRES_IN,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, AuthGrpcController, HealthController],
  providers: [
    AuthService,
    AuthGrpcService,
    UserRepository,
    SocialAccountRepository,
    RefreshTokenRepository,
    PrismaService,
    GoogleAuthService,
    FacebookAuthService,
    AppleAuthService,
    InstagramAuthService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
