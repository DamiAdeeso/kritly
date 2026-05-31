import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGrpcController } from './auth.grpc.controller';
import { HealthGrpcController } from '../health/health.grpc.controller';
import { SocialAccountRepository } from '../repositories';
import { SharedModule } from '../shared/shared.module';
import { GoogleAuthService } from './strategies/google-auth.service';
import { FacebookAuthService } from './strategies/facebook-auth.service';
import { AppleAuthService } from './strategies/apple-auth.service';
import { InstagramAuthService } from './strategies/instagram-auth.service';

@Module({
  imports: [SharedModule],
  controllers: [AuthGrpcController, HealthGrpcController],
  providers: [
    AuthService,
    SocialAccountRepository,
    GoogleAuthService,
    FacebookAuthService,
    AppleAuthService,
    InstagramAuthService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
