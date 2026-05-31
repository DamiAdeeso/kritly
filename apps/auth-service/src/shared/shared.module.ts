import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AUTH_CONSTANTS, resolveJwtSecret } from '@kritly/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountRepository } from '../repositories/account.repository';
import { ProfileRepository } from '../repositories/profile.repository';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { TokenService } from './token.service';

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
  providers: [
    PrismaService,
    AccountRepository,
    ProfileRepository,
    RefreshTokenRepository,
    TokenService,
  ],
  exports: [
    PrismaService,
    AccountRepository,
    ProfileRepository,
    RefreshTokenRepository,
    TokenService,
    JwtModule,
  ],
})
export class SharedModule {}
