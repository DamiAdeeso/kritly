import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OtpPurpose, VERIFICATION_METADATA_KEY } from '@kritly/common';
import { AuthClientService } from '../services/auth-client.service';
import { VerificationClientService } from '../services/verification-client.service';

@Injectable()
export class VerificationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authClient: AuthClientService,
    private readonly verificationClient: VerificationClientService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const purpose = this.reflector.getAllAndOverride<OtpPurpose | undefined>(
      VERIFICATION_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!purpose) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      verifiedUser?: { userId: string; email: string };
    }>();

    const authHeader = request.headers.authorization;
    const verificationToken = request.headers['x-verification-token'];

    if (!authHeader) {
      throw new UnauthorizedException('No token provided');
    }

    if (!verificationToken) {
      throw new ForbiddenException('Verification token required for this action');
    }

    const accessToken = authHeader.replace('Bearer ', '');
    const tokenValidation = await this.authClient.validateToken({ accessToken });

    if (
      tokenValidation.statusCode !== 200 ||
      !tokenValidation.data?.isValid ||
      !tokenValidation.data.userId
    ) {
      throw new UnauthorizedException('Invalid token');
    }

    const verificationValidation = await this.verificationClient.validateVerificationToken({
      verificationToken,
      purpose,
      userId: tokenValidation.data.userId,
    });

    if (!verificationValidation.data?.isValid) {
      throw new ForbiddenException('Invalid or expired verification token for this action');
    }

    request.verifiedUser = {
      userId: tokenValidation.data.userId,
      email: tokenValidation.data.email,
    };

    return true;
  }
}
