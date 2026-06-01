import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  DOMAIN_EVENTS,
  EventPublisher,
  OtpChannel,
  OTP_CHANNELS,
  OTP_PURPOSES,
  OtpPurpose,
  SendOtpRequest,
  ServiceResponse,
  ConsumeVerificationTokenRequest,
  ValidateVerificationTokenRequest,
  VerifyOtpRequest,
  ok,
} from '@kritly/common';
import { OtpService } from './otp.service';

export type SendOtpServiceResponse = ServiceResponse<{
  expiresAt: number;
  expiresInSeconds: number;
}>;

export type VerifyOtpServiceResponse = ServiceResponse<{
  verificationToken: string;
  expiresAt: number;
}>;

export type ValidateVerificationTokenServiceResponse = ServiceResponse<{
  isValid: boolean;
}>;

@Injectable()
export class VerificationService {
  constructor(
    @InjectPinoLogger(VerificationService.name) private readonly logger: PinoLogger,
    private readonly otpService: OtpService,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async sendOtp(request: SendOtpRequest): Promise<SendOtpServiceResponse> {
    this.validatePurpose(request.purpose);
    this.validateChannel(request.channel);

    const subject = this.otpService.normalizeSubject(request.subject);
    this.logger.info(
      {
        purpose: request.purpose,
        channel: request.channel,
        subject,
        userId: request.userId ?? null,
      },
      'sendOtp',
    );

    await this.otpService.assertCanSend(request.purpose, subject);

    const code = this.otpService.generateCode();
    const expiresInSeconds = await this.otpService.storeCode(
      request.purpose,
      subject,
      code,
      request.userId,
    );

    if (request.channel === OtpChannel.EMAIL) {
      this.enqueueEmailOtp(subject, request.purpose, code, expiresInSeconds);
    } else {
      throw new BadRequestException('SMS verification is not enabled yet');
    }

    this.logger.info(
      { purpose: request.purpose, subject, expiresInSeconds },
      'sendOtp queued for delivery',
    );

    return ok('Verification code sent', {
      expiresAt: Math.floor(Date.now() / 1000) + expiresInSeconds,
      expiresInSeconds,
    });
  }

  async verifyOtp(request: VerifyOtpRequest): Promise<VerifyOtpServiceResponse> {
    this.validatePurpose(request.purpose);

    const subject = this.otpService.normalizeSubject(request.subject);
    this.logger.info({ purpose: request.purpose, subject }, 'verifyOtp');

    const { userId } = await this.otpService.verifyCode(request.purpose, subject, request.code.trim());

    const token = await this.otpService.issueVerificationToken({
      userId,
      purpose: request.purpose,
      subject,
    });

    this.logger.info(
      {
        purpose: request.purpose,
        subject,
        userId: userId ?? null,
        expiresAt: token.expiresAt,
      },
      'verifyOtp issued token',
    );

    return ok('Verification successful', token, 200);
  }

  async validateVerificationToken(
    request: ValidateVerificationTokenRequest,
  ): Promise<ValidateVerificationTokenServiceResponse> {
    const isValid = await this.otpService.validateVerificationToken({
      verificationToken: request.verificationToken,
      purpose: request.purpose,
      userId: request.userId,
      email: request.email,
    });

    return ok(
      isValid ? 'Verification token is valid' : 'Verification token is invalid',
      { isValid },
    );
  }

  async consumeVerificationToken(
    request: ConsumeVerificationTokenRequest,
  ): Promise<ValidateVerificationTokenServiceResponse> {
    this.logger.info(
      {
        purpose: request.purpose,
        userId: request.userId ?? null,
        email: request.email ?? null,
      },
      'consumeVerificationToken',
    );

    const isValid = await this.otpService.consumeVerificationToken({
      verificationToken: request.verificationToken,
      purpose: request.purpose,
      userId: request.userId,
      email: request.email,
    });

    this.logger.info({ isValid }, 'consumeVerificationToken result');

    return ok(
      isValid ? 'Verification token consumed' : 'Verification token is invalid',
      { isValid },
    );
  }

  private enqueueEmailOtp(
    recipient: string,
    purpose: string,
    code: string,
    expiresInSeconds: number,
  ): void {
    const idempotencyKey = `otp:${purpose}:${recipient}:${Math.floor(Date.now() / 60_000)}`;

    this.eventPublisher.publish(
      DOMAIN_EVENTS.VERIFICATION_OTP_REQUESTED,
      {
        recipient,
        purpose,
        code,
        expiresIn: this.otpService.formatExpiresIn(expiresInSeconds),
        purposeLabel: this.otpService.purposeLabel(purpose),
      },
      { idempotencyKey },
    );
  }

  private validatePurpose(purpose: string): void {
    if (!OTP_PURPOSES.includes(purpose as OtpPurpose)) {
      throw new BadRequestException(`Invalid verification purpose: ${purpose}`);
    }
  }

  private validateChannel(channel: string): void {
    if (!OTP_CHANNELS.includes(channel as OtpChannel)) {
      throw new BadRequestException(`Invalid verification channel: ${channel}`);
    }
  }
}
