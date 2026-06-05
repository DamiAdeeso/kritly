import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { hashSubject, isHttpClientError, OtpPurpose } from '@kritly/common';
import { VerificationClientService } from './verification-client.service';

@Injectable()
export class VerificationEnforcementService {
  constructor(
    private readonly verificationClient: VerificationClientService,
    @InjectPinoLogger(VerificationEnforcementService.name) private readonly logger: PinoLogger,
  ) {}

  async requireVerificationToken(input: {
    verificationToken: string;
    purpose: OtpPurpose;
    userId?: string;
    email?: string;
  }): Promise<void> {
    const token = input.verificationToken?.trim();
    if (!token) {
      this.logger.warn({ purpose: input.purpose }, 'requireVerificationToken rejected missing token');
      throw new ForbiddenException('Verification token required for this action');
    }

    this.logger.info(
      {
        purpose: input.purpose,
        userId: input.userId ?? null,
        emailHash: input.email ? hashSubject(input.email) : null,
      },
      'requireVerificationToken',
    );

    const result = await this.verificationClient.consumeVerificationToken({
      verificationToken: token,
      purpose: input.purpose,
      userId: input.userId,
      email: input.email,
    });

    if (isHttpClientError(result) || !result.isValid) {
      this.logger.warn(
        { purpose: input.purpose, isValid: isHttpClientError(result) ? null : result.isValid },
        'requireVerificationToken rejected',
      );
      throw new ForbiddenException('Invalid or expired verification token for this action');
    }

    this.logger.info({ purpose: input.purpose }, 'requireVerificationToken consumed');
  }
}
