import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGrpcImplementation } from './auth.grpc.implementation';
import { SocialAccountRepository } from '../repositories';
import { SharedModule } from '../shared/shared.module';
import { GoogleAuthService } from './strategies/google-auth.service';
import { FacebookAuthService } from './strategies/facebook-auth.service';
import { AppleAuthService } from './strategies/apple-auth.service';
import { InstagramAuthService } from './strategies/instagram-auth.service';

@Module({
  imports: [SharedModule],
  providers: [
    AuthService,
    AuthGrpcImplementation,
    SocialAccountRepository,
    GoogleAuthService,
    FacebookAuthService,
    AppleAuthService,
    InstagramAuthService,
  ],
  exports: [AuthService, AuthGrpcImplementation],
})
export class AuthModule {}
