import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  hashSubject,
  HttpClientErrorResponse,
  OtpChannel,
  OtpPurpose,
  SendOtpDto,
  SendOtpData,
  SendOtpResponseDto,
  VerifyOtpDto,
  VerifyOtpData,
  VerifyOtpResponseDto,
  ServiceResponse,
  httpFail,
  isHttpClientError,
  mapGrpcToHttp,
  ApiEnvelopeErrors,
} from '@kritly/common';
import { AuthClientService } from '../services/auth-client.service';
import { VerificationClientService } from '../services/verification-client.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { OptionalCurrentUser } from '../auth/current-user.decorator';
import { JwtTokenService } from '../auth/jwt-token.service';
import { JwtUser } from '../auth/jwt-user.interface';

@ApiTags('Verification')
@ApiEnvelopeErrors(400, 401, 403, 429, 500)
@Controller('api/verification')
export class VerificationGatewayController {
  constructor(
    private readonly authClient: AuthClientService,
    private readonly verificationClient: VerificationClientService,
    private readonly jwtTokenService: JwtTokenService,
    @InjectPinoLogger(VerificationGatewayController.name)
    private readonly logger: PinoLogger,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('send')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Send a verification OTP' })
  @ApiBearerAuth()
  @ApiBody({ type: SendOtpDto })
  @ApiResponse({ status: 200, description: 'Verification code sent', type: SendOtpResponseDto })
  async sendOtp(
    @Headers('authorization') authHeader: string | undefined,
    @OptionalCurrentUser() user: JwtUser | undefined,
    @Body() dto: SendOtpDto,
  ): Promise<ServiceResponse<SendOtpData> | HttpClientErrorResponse> {
    const bearerError = this.invalidBearerTokenResponse(authHeader, user);
    if (bearerError) {
      return bearerError;
    }

    if (user) {
      return mapGrpcToHttp(
        await this.verificationClient.sendOtp({
          subject: user.email,
          purpose: dto.purpose,
          channel: dto.channel,
          userId: user.userId,
        }),
        'Verification code sent',
      );
    }

    if (dto.purpose === OtpPurpose.PASSWORD_RESET && dto.email) {
      const email = dto.email.trim().toLowerCase();

      return mapGrpcToHttp(
        await this.verificationClient.sendOtp({
          subject: email,
          purpose: dto.purpose,
          channel: dto.channel,
        }),
        'Verification code sent',
      );
    }

    if (dto.purpose === OtpPurpose.EMAIL_VERIFY && dto.email) {
      const email = dto.email.trim().toLowerCase();
      const availability = await this.authClient.checkEmailAvailability({ email });

      if (isHttpClientError(availability)) {
        return availability;
      }

      if (!availability.isAvailable) {
        this.logger.warn({ subjectHash: hashSubject(email) }, 'sendOtp rejected: email already registered');
        return httpFail('Email is already registered', HttpStatus.BAD_REQUEST);
      }

      return mapGrpcToHttp(
        await this.verificationClient.sendOtp({
          subject: email,
          purpose: dto.purpose,
          channel: dto.channel,
        }),
        'Verification code sent',
      );
    }

    return httpFail('Authentication required for this verification purpose', HttpStatus.UNAUTHORIZED);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Verify an OTP and receive a short-lived verification token' })
  @ApiBearerAuth()
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({ status: 200, description: 'Verification successful', type: VerifyOtpResponseDto })
  async verifyOtp(
    @Headers('authorization') authHeader: string | undefined,
    @OptionalCurrentUser() user: JwtUser | undefined,
    @Body() dto: VerifyOtpDto,
  ): Promise<ServiceResponse<VerifyOtpData> | HttpClientErrorResponse> {
    const bearerError = this.invalidBearerTokenResponse(authHeader, user);
    if (bearerError) {
      return bearerError;
    }

    let subject = dto.email?.trim().toLowerCase();

    if (user) {
      subject = user.email;
    }

    if (!subject) {
      return httpFail('Email is required to verify this code', HttpStatus.BAD_REQUEST);
    }

    return mapGrpcToHttp(
      await this.verificationClient.verifyOtp({
        subject,
        purpose: dto.purpose,
        code: dto.code,
      }),
      'Verification successful',
    );
  }

  /** When a bearer token is present but invalid, return the HTTP error envelope (do not throw). */
  private invalidBearerTokenResponse(
    authHeader: string | undefined,
    user: JwtUser | undefined,
  ): HttpClientErrorResponse | undefined {
    const token = this.jwtTokenService.extractBearerToken(authHeader);
    if (token && !user) {
      return httpFail('Invalid token', HttpStatus.UNAUTHORIZED);
    }
    return undefined;
  }
}
