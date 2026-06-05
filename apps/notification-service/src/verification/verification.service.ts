import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  DOMAIN_EVENTS,
  EventPublisher,
  hashSubject,
  OtpChannel,
  OTP_CHANNELS,
  OTP_PURPOSES,
  OtpPurpose,
  SendOtpRequest,
  SendOtpData,
  ConsumeVerificationTokenRequest,
  ValidateVerificationTokenRequest,
  ValidateVerificationTokenData,
  VerifyOtpRequest,
  VerifyOtpData,
} from '@kritly/common';
import { OtpService } from './otp.service';

@Injectable()
export class VerificationService {
  constructor(
    @InjectPinoLogger(VerificationService.name) private readonly logger: PinoLogger,
    private readonly otpService: OtpService,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async sendOtp(request: SendOtpRequest): Promise<SendOtpData> {
    this.validatePurpose(request.purpose);
    this.validateChannel(request.channel);

    const subject = this.otpService.normalizeSubject(request.subject);
    this.logger.info(
      {
        purpose: request.purpose,
        channel: request.channel,
        subjectHash: hashSubject(subject),
        userId: request.userId ?? null,
      },
      'sendOtp',
    );

    await this.otpService.assertCanSend(request.purpose, subject);

    const bypassActive = this.otpService.isBypassActive();
    let expiresInSeconds: number;

    if (bypassActive) {
      expiresInSeconds = this.otpService.getTtlSeconds();
      this.logger.warn(
        {
          purpose: request.purpose,
          channel: request.channel,
          subjectHash: hashSubject(subject),
          userId: request.userId ?? null,
        },
        'OTP bypass enabled; email delivery skipped',
      );
    } else {
      const code = this.otpService.generateCode();
      expiresInSeconds = await this.otpService.storeCode(
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
    }

    this.logger.info(
      { purpose: request.purpose, subjectHash: hashSubject(subject), expiresInSeconds },
      'sendOtp queued for delivery',
    );

    return {
      expiresAt: Math.floor(Date.now() / 1000) + expiresInSeconds,
      expiresInSeconds,
    };
  }

  async verifyOtp(request: VerifyOtpRequest): Promise<VerifyOtpData> {
    this.validatePurpose(request.purpose);

    const subject = this.otpService.normalizeSubject(request.subject);
    this.logger.info({ purpose: request.purpose, subjectHash: hashSubject(subject) }, 'verifyOtp');

    const { userId } = await this.otpService.verifyCode(request.purpose, subject, request.code.trim());

    const token = await this.otpService.issueVerificationToken({
      userId,
      purpose: request.purpose,
      subject,
    });

    this.logger.info(
      {
        purpose: request.purpose,
        subjectHash: hashSubject(subject),
        userId: userId ?? null,
        expiresAt: token.expiresAt,
      },
      'verifyOtp issued token',
    );

    return token;
  }

  async validateVerificationToken(
    request: ValidateVerificationTokenRequest,
  ): Promise<ValidateVerificationTokenData> {
    const isValid = await this.otpService.validateVerificationToken({
      verificationToken: request.verificationToken,
      purpose: request.purpose,
      userId: request.userId,
      email: request.email,
    });

    return { isValid };
  }

  async consumeVerificationToken(
    request: ConsumeVerificationTokenRequest,
  ): Promise<ValidateVerificationTokenData> {
    this.logger.info(
      {
        purpose: request.purpose,
        userId: request.userId ?? null,
        emailHash: request.email ? hashSubject(request.email) : null,
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

    return { isValid };
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
