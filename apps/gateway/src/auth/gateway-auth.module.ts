import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AUTH_CONSTANTS, resolveJwtSecret } from '@kritly/common';
import { JwtTokenService } from './jwt-token.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: resolveJwtSecret({
          NODE_ENV: configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV,
          JWT_SECRET: configService.get<string>('JWT_SECRET'),
        }),
        signOptions: {
          expiresIn: AUTH_CONSTANTS.JWT_EXPIRES_IN,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [JwtTokenService, JwtAuthGuard, OptionalJwtAuthGuard],
  exports: [JwtModule, JwtTokenService, JwtAuthGuard, OptionalJwtAuthGuard],
})
export class GatewayAuthModule {}
