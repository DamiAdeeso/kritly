import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OtpPurpose, VERIFICATION_METADATA_KEY } from '@kritly/common';
import { VerificationEnforcementService } from '../shared/verification-enforcement.service';

interface VerificationRpcData {
  verificationToken?: string;
  email?: string;
  userId?: string;
}

@Injectable()
export class GrpcVerificationGuard implements CanActivate {
  private readonly logger = new Logger(GrpcVerificationGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly verificationEnforcement: VerificationEnforcementService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const purpose = this.reflector.getAllAndOverride<OtpPurpose | undefined>(
      VERIFICATION_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!purpose) {
      return true;
    }

    const data = context.switchToRpc().getData<VerificationRpcData>();
    const subject = this.resolveSubject(purpose, data);

    this.logger.log(
      `canActivate purpose=${purpose} userId=${subject.userId ?? 'none'} email=${subject.email ?? 'none'}`,
    );

    await this.verificationEnforcement.requireVerificationToken({
      verificationToken: data.verificationToken ?? '',
      purpose,
      ...subject,
    });

    return true;
  }

  private resolveSubject(
    purpose: OtpPurpose,
    data: VerificationRpcData,
  ): { email?: string; userId?: string } {
    switch (purpose) {
      case OtpPurpose.EMAIL_VERIFY:
      case OtpPurpose.PASSWORD_RESET:
        return { email: data.email?.trim().toLowerCase() };
      case OtpPurpose.SENSITIVE_ACTION:
        return { userId: data.userId };
      default:
        return {};
    }
  }
}
