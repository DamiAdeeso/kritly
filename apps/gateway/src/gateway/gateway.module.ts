import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { OAuthGatewayController } from './oauth.gateway.controller';
import { AuthGatewayController } from './auth.gateway.controller';
import { UserGatewayController } from './user.gateway.controller';
import { UploadGatewayController } from './upload.gateway.controller';
import { VerificationGatewayController } from './verification.gateway.controller';
import { AuthClientService } from '../services/auth-client.service';
import { UserClientService } from '../services/user-client.service';
import { UploadClientService } from '../services/upload-client.service';
import { OAuthService } from '../services/oauth.service';
import { VerificationClientService } from '../services/verification-client.service';
import { HealthController } from '../health/health.controller';

@Module({
  controllers: [
    GatewayController,
    AuthGatewayController,
    OAuthGatewayController,
    UserGatewayController,
    UploadGatewayController,
    VerificationGatewayController,
    HealthController,
  ],
  providers: [
    AuthClientService,
    UserClientService,
    OAuthService,
    UploadClientService,
    VerificationClientService,
  ],
  exports: [
    AuthClientService,
    UserClientService,
    UploadClientService,
    VerificationClientService,
  ],
})
export class GatewayModule {}
