import { BadRequestException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Status, wrapGrpcImplementation } from '@kritly/common';
import { VerificationGrpcImplementation } from './verification.grpc.implementation';
import { VerificationService } from './verification.service';

describe('VerificationGrpcImplementation', () => {
  let implementation: VerificationGrpcImplementation;
  let verificationService: jest.Mocked<Pick<VerificationService, 'sendOtp'>>;
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as PinoLogger;

  beforeEach(() => {
    verificationService = {
      sendOtp: jest.fn(),
    };
    implementation = new VerificationGrpcImplementation(
      verificationService as unknown as VerificationService,
      logger,
    );
  });

  it('delegates sendOtp to VerificationService', async () => {
    verificationService.sendOtp.mockResolvedValue({
      expiresAt: 1,
      expiresInSeconds: 600,
    });

    const wrapped = wrapGrpcImplementation(implementation);
    const result = await wrapped.sendOtp({
      subject: 'user@example.com',
      purpose: 'password_reset',
      channel: 'email',
    });

    expect(result.expiresInSeconds).toBe(600);
  });

  it('maps invalid purpose failures to INVALID_ARGUMENT', async () => {
    verificationService.sendOtp.mockRejectedValue(new BadRequestException('Invalid verification purpose: bad'));
    const wrapped = wrapGrpcImplementation(implementation);

    await expect(
      wrapped.sendOtp({
        subject: 'user@example.com',
        purpose: 'password_reset',
        channel: 'email',
      }),
    ).rejects.toMatchObject({
      code: Status.INVALID_ARGUMENT,
      details: 'Invalid verification purpose: bad',
    });
  });
});
