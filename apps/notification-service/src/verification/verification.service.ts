import { BadRequestException, Injectable } from '@nestjs/common';
import {
  NOTIFICATION_TEMPLATE_KEYS,
  NotificationSendEvent,
  OtpChannel,
  OTP_CHANNELS,
  OTP_PURPOSES,
  OtpPurpose,
  SendOtpRequest,
  ServiceResponse,
  ValidateVerificationTokenRequest,
  VerifyOtpRequest,
  ok,
} from '@kritly/common';
import { NotificationService } from '../notifications/notification.service';
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
    private readonly otpService: OtpService,
    private readonly notificationService: NotificationService,
  ) {}

  async sendOtp(request: SendOtpRequest): Promise<SendOtpServiceResponse> {
    this.validatePurpose(request.purpose);
    this.validateChannel(request.channel);

    const subject = this.otpService.normalizeSubject(request.subject);
    await this.otpService.assertCanSend(request.purpose, subject);

    const code = this.otpService.generateCode();
    const expiresInSeconds = await this.otpService.storeCode(
      request.purpose,
      subject,
      code,
      request.userId,
    );

    if (request.channel === OtpChannel.EMAIL) {
      await this.deliverEmailOtp(subject, request.purpose, code, expiresInSeconds);
    } else {
      throw new BadRequestException('SMS verification is not enabled yet');
    }

    return ok('Verification code sent', {
      expiresAt: Math.floor(Date.now() / 1000) + expiresInSeconds,
      expiresInSeconds,
    });
  }

  async verifyOtp(request: VerifyOtpRequest): Promise<VerifyOtpServiceResponse> {
    this.validatePurpose(request.purpose);

    const subject = this.otpService.normalizeSubject(request.subject);
    const { userId } = await this.otpService.verifyCode(request.purpose, subject, request.code.trim());

    const token = await this.otpService.issueVerificationToken({
      userId,
      purpose: request.purpose,
      subject,
    });

    return ok('Verification successful', token, 200);
  }

  async validateVerificationToken(
    request: ValidateVerificationTokenRequest,
  ): Promise<ValidateVerificationTokenServiceResponse> {
    const isValid = await this.otpService.validateVerificationToken({
      verificationToken: request.verificationToken,
      purpose: request.purpose,
      userId: request.userId,
    });

    return ok(
      isValid ? 'Verification token is valid' : 'Verification token is invalid',
      { isValid },
    );
  }

  private async deliverEmailOtp(
    recipient: string,
    purpose: string,
    code: string,
    expiresInSeconds: number,
  ): Promise<void> {
    const event: NotificationSendEvent = {
      templateKey: NOTIFICATION_TEMPLATE_KEYS.VERIFICATION_OTP,
      channel: 'email',
      recipient,
      data: {
        code,
        expiresIn: this.otpService.formatExpiresIn(expiresInSeconds),
        purposeLabel: this.otpService.purposeLabel(purpose),
      },
      idempotencyKey: `otp:${purpose}:${recipient}:${Math.floor(Date.now() / 60_000)}`,
      source: 'notification-service',
      createdAt: new Date().toISOString(),
    };

    await this.notificationService.process(event);
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
