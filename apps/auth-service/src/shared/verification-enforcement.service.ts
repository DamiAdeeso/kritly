import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { grpcData, grpcIsValid, grpcStatusCode, OtpPurpose } from '@kritly/common';
import { VerificationClientService } from './verification-client.service';

@Injectable()
export class VerificationEnforcementService {
  private readonly logger = new Logger(VerificationEnforcementService.name);

  constructor(private readonly verificationClient: VerificationClientService) {}

  async requireVerificationToken(input: {
    verificationToken: string;
    purpose: OtpPurpose;
    userId?: string;
    email?: string;
  }): Promise<void> {
    const token = input.verificationToken?.trim();
    if (!token) {
      this.logger.warn(`requireVerificationToken rejected missing token purpose=${input.purpose}`);
      throw new ForbiddenException('Verification token required for this action');
    }

    this.logger.log(
      `requireVerificationToken purpose=${input.purpose} userId=${input.userId ?? 'none'} email=${input.email ?? 'none'}`,
    );

    const result = await this.verificationClient.consumeVerificationToken({
      verificationToken: token,
      purpose: input.purpose,
      userId: input.userId,
      email: input.email,
    });

    const envelope = result as unknown as Record<string, unknown>;
    const statusCode = grpcStatusCode(envelope);
    const isValid = grpcIsValid(grpcData(envelope));

    if (statusCode !== 200 || !isValid) {
      this.logger.warn(
        `requireVerificationToken rejected purpose=${input.purpose} statusCode=${statusCode} isValid=${isValid ?? false}`,
      );
      throw new ForbiddenException('Invalid or expired verification token for this action');
    }

    this.logger.log(`requireVerificationToken consumed purpose=${input.purpose}`);
  }
}
