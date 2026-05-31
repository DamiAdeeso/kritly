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
import {
  GrpcErrorResponse,
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

    if (token) {
      const validation = await this.authClient.validateToken({ accessToken: token });
      if (validation.statusCode !== 200 || !validation.data?.isValid || !validation.data.email) {
        throw new UnauthorizedException('Invalid token');
      }

      return this.verificationClient.sendOtp({
        subject: validation.data.email,
        purpose: dto.purpose,
        channel: dto.channel,
        userId: validation.data.userId,
      });
    }

    if (dto.purpose !== OtpPurpose.PASSWORD_RESET || !dto.email) {
      throw new UnauthorizedException('Authentication required for this verification purpose');
    }

    return this.verificationClient.sendOtp({
      subject: dto.email,
      purpose: dto.purpose,
      channel: dto.channel,
    });
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
    let subject = dto.email;

    if (token) {
      const validation = await this.authClient.validateToken({ accessToken: token });
      if (validation.statusCode !== 200 || !validation.data?.isValid || !validation.data.email) {
        throw new UnauthorizedException('Invalid token');
      }

      subject = validation.data.email;
    }

    if (!subject) {
      throw new BadRequestException('Email is required to verify this code');
    }

    return this.verificationClient.verifyOtp({
      subject,
      purpose: dto.purpose,
      code: dto.code,
    });
  }
}
