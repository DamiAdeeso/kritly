import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { OtpPurpose } from '@kritly/common';
import { VerificationClientService } from '../services/verification-client.service';

@Injectable()
export class PasswordResetGuard implements CanActivate {
  constructor(private readonly verificationClient: VerificationClientService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      body: { email?: string };
      passwordResetEmail?: string;
    }>();

    const verificationToken = request.headers['x-verification-token'];
    const email = request.body.email?.trim().toLowerCase();

    if (!verificationToken) {
      throw new ForbiddenException('Verification token required for this action');
    }

    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const verificationValidation = await this.verificationClient.validateVerificationToken({
      verificationToken,
      purpose: OtpPurpose.PASSWORD_RESET,
      userId: email,
    });

    if (!verificationValidation.data?.isValid) {
      throw new ForbiddenException('Invalid or expired verification token for this action');
    }

    request.passwordResetEmail = email;
    return true;
  }
}
