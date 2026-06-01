import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OtpPurpose, VERIFICATION_METADATA_KEY } from '@kritly/common';
import { GrpcVerificationGuard } from './grpc-verification.guard';
import { VerificationEnforcementService } from '../shared/verification-enforcement.service';

describe('GrpcVerificationGuard', () => {
  let guard: GrpcVerificationGuard;
  let reflector: jest.Mocked<Reflector>;
  let verificationEnforcement: jest.Mocked<VerificationEnforcementService>;

  const createContext = (data: Record<string, string | undefined>): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToRpc: () => ({
        getData: () => data,
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    verificationEnforcement = {
      requireVerificationToken: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<VerificationEnforcementService>;

    guard = new GrpcVerificationGuard(reflector, verificationEnforcement);
  });

  it('allows handlers without verification metadata', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    await expect(guard.canActivate(createContext({}))).resolves.toBe(true);
    expect(verificationEnforcement.requireVerificationToken).not.toHaveBeenCalled();
  });

  it('consumes email-bound tokens for register', async () => {
    reflector.getAllAndOverride.mockReturnValue(OtpPurpose.EMAIL_VERIFY);

    await expect(
      guard.canActivate(
        createContext({
          email: 'User@Example.com',
          verificationToken: 'verification-token',
        }),
      ),
    ).resolves.toBe(true);

    expect(verificationEnforcement.requireVerificationToken).toHaveBeenCalledWith({
      verificationToken: 'verification-token',
      purpose: OtpPurpose.EMAIL_VERIFY,
      email: 'user@example.com',
    });
  });

  it('consumes user-bound tokens for sensitive actions', async () => {
    reflector.getAllAndOverride.mockReturnValue(OtpPurpose.SENSITIVE_ACTION);

    await expect(
      guard.canActivate(
        createContext({
          userId: 'user-1',
          verificationToken: 'verification-token',
        }),
      ),
    ).resolves.toBe(true);

    expect(verificationEnforcement.requireVerificationToken).toHaveBeenCalledWith({
      verificationToken: 'verification-token',
      purpose: OtpPurpose.SENSITIVE_ACTION,
      userId: 'user-1',
    });
  });

  it('propagates verification failures', async () => {
    reflector.getAllAndOverride.mockReturnValue(OtpPurpose.PASSWORD_RESET);
    verificationEnforcement.requireVerificationToken.mockRejectedValue(
      new ForbiddenException('Invalid or expired verification token for this action'),
    );

    await expect(
      guard.canActivate(
        createContext({
          email: 'user@example.com',
          verificationToken: 'bad-token',
        }),
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
