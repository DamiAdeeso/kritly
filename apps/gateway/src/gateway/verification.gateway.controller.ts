import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
  ValidationPipe,
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
  GrpcErrorResponse,
  grpcData,
  grpcIsAvailable,
  grpcStatusCode,
  OtpChannel,
  OtpPurpose,
  SendOtpDto,
  SendOtpResponse,
  SendOtpResponseDto,
  VerificationGrpcErrorResponse,
  VerifyOtpDto,
  VerifyOtpResponse,
  VerifyOtpResponseDto,
} from '@kritly/common';
import { AuthClientService } from '../services/auth-client.service';
import { VerificationClientService } from '../services/verification-client.service';

@ApiTags('Verification')
@Controller('api/verification')
export class VerificationGatewayController {
  constructor(
    private readonly authClient: AuthClientService,
    private readonly verificationClient: VerificationClientService,
    @InjectPinoLogger(VerificationGatewayController.name)
    private readonly logger: PinoLogger,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a verification OTP' })
  @ApiBearerAuth()
  @ApiBody({ type: SendOtpDto })
  @ApiResponse({ status: 200, description: 'Verification code sent', type: SendOtpResponseDto })
  async sendOtp(
    @Headers('authorization') authHeader: string | undefined,
    @Body(ValidationPipe) dto: SendOtpDto,
  ): Promise<SendOtpResponse | VerificationGrpcErrorResponse | GrpcErrorResponse> {
    const token = authHeader?.replace('Bearer ', '');

    this.logger.info(
      {
        purpose: dto.purpose,
        channel: dto.channel,
        authenticated: Boolean(token),
        email: dto.email ?? null,
      },
      'sendOtp request',
    );

    if (token) {
      const validation = await this.authClient.validateToken({ accessToken: token });
      if (validation.statusCode !== 200 || !validation.data?.isValid || !validation.data.email) {
        this.logger.warn(
          {
            statusCode: validation.statusCode,
            isValid: validation.data?.isValid ?? false,
          },
          'sendOtp rejected invalid token',
        );
        throw new UnauthorizedException('Invalid token');
      }

      this.logger.info(
        { userId: validation.data.userId, purpose: dto.purpose },
        'sendOtp dispatching authenticated OTP',
      );

      return this.verificationClient.sendOtp({
        subject: validation.data.email,
        purpose: dto.purpose,
        channel: dto.channel,
        userId: validation.data.userId,
      });
    }

    if (dto.purpose === OtpPurpose.PASSWORD_RESET && dto.email) {
      const email = dto.email.trim().toLowerCase();
      this.logger.info({ email }, 'sendOtp dispatching password-reset OTP');

      return this.verificationClient.sendOtp({
        subject: email,
        purpose: dto.purpose,
        channel: dto.channel,
      });
    }

    if (dto.purpose === OtpPurpose.EMAIL_VERIFY && dto.email) {
      const email = dto.email.trim().toLowerCase();
      this.logger.info({ email }, 'sendOtp checking email availability');

      const availability = (await this.authClient.checkEmailAvailability({
        email,
      })) as unknown as Record<string, unknown>;
      const statusCode = grpcStatusCode(availability);
      const data = grpcData(availability);
      const isAvailable = grpcIsAvailable(data);

      this.logger.info(
        { email, statusCode, message: availability['message'], isAvailable, data },
        'sendOtp email availability response',
      );

      if (statusCode !== 200 || !isAvailable) {
        this.logger.warn({ email, statusCode, isAvailable }, 'sendOtp rejected signup email verify');
        throw new BadRequestException('Email is already registered');
      }

      this.logger.info({ email }, 'sendOtp dispatching signup email verify OTP');

      return this.verificationClient.sendOtp({
        subject: email,
        purpose: dto.purpose,
        channel: dto.channel,
      });
    }

    this.logger.warn(
      { purpose: dto.purpose, email: dto.email ?? null },
      'sendOtp rejected missing auth',
    );
    throw new UnauthorizedException('Authentication required for this verification purpose');
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify an OTP and receive a short-lived verification token' })
  @ApiBearerAuth()
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({ status: 200, description: 'Verification successful', type: VerifyOtpResponseDto })
  async verifyOtp(
    @Headers('authorization') authHeader: string | undefined,
    @Body(ValidationPipe) dto: VerifyOtpDto,
  ): Promise<VerifyOtpResponse | VerificationGrpcErrorResponse | GrpcErrorResponse> {
    const token = authHeader?.replace('Bearer ', '');
    let subject = dto.email?.trim().toLowerCase();

    this.logger.info(
      {
        purpose: dto.purpose,
        authenticated: Boolean(token),
        email: dto.email ?? null,
      },
      'verifyOtp request',
    );

    if (token) {
      const validation = await this.authClient.validateToken({ accessToken: token });
      if (validation.statusCode !== 200 || !validation.data?.isValid || !validation.data.email) {
        this.logger.warn(
          {
            statusCode: validation.statusCode,
            isValid: validation.data?.isValid ?? false,
          },
          'verifyOtp rejected invalid token',
        );
        throw new UnauthorizedException('Invalid token');
      }

      subject = validation.data.email;
    }

    if (!subject) {
      this.logger.warn({ purpose: dto.purpose }, 'verifyOtp rejected missing subject');
      throw new BadRequestException('Email is required to verify this code');
    }

    this.logger.info({ purpose: dto.purpose, subject }, 'verifyOtp dispatching');

    return this.verificationClient.verifyOtp({
      subject,
      purpose: dto.purpose,
      code: dto.code,
    });
  }
}
