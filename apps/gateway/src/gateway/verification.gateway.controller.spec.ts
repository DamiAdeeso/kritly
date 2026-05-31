import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { OtpPurpose, OtpChannel } from '@kritly/common';
import { VerificationGatewayController } from './verification.gateway.controller';
import { AuthClientService } from '../services/auth-client.service';
import { VerificationClientService } from '../services/verification-client.service';

describe('VerificationGatewayController', () => {
  let controller: VerificationGatewayController;
  let authClient: jest.Mocked<AuthClientService>;
  let verificationClient: jest.Mocked<VerificationClientService>;

  beforeEach(async () => {
    authClient = {
      validateToken: jest.fn(),
    } as unknown as jest.Mocked<AuthClientService>;

    verificationClient = {
      sendOtp: jest.fn(),
      verifyOtp: jest.fn(),
      validateVerificationToken: jest.fn(),
    } as unknown as jest.Mocked<VerificationClientService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VerificationGatewayController],
      providers: [
        { provide: AuthClientService, useValue: authClient },
        { provide: VerificationClientService, useValue: verificationClient },
      ],
    }).compile();

    controller = module.get<VerificationGatewayController>(VerificationGatewayController);
  });

  it('sends OTP for authenticated users', async () => {
    authClient.validateToken.mockResolvedValue({
      statusCode: 200,
      message: 'Token validation successful',
      data: { isValid: true, userId: 'user-1', email: 'user@example.com' },
    });
    verificationClient.sendOtp.mockResolvedValue({
      statusCode: 200,
      message: 'Verification code sent',
      data: { expiresAt: 1_700_000_000, expiresInSeconds: 600 },
    });

    await controller.sendOtp('Bearer token', {
      purpose: OtpPurpose.EMAIL_VERIFY,
      channel: OtpChannel.EMAIL,
    });

    expect(verificationClient.sendOtp).toHaveBeenCalledWith({
      subject: 'user@example.com',
      purpose: OtpPurpose.EMAIL_VERIFY,
      channel: OtpChannel.EMAIL,
      userId: 'user-1',
    });
  });

  it('allows password reset OTP without auth when email is provided', async () => {
    verificationClient.sendOtp.mockResolvedValue({
      statusCode: 200,
      message: 'Verification code sent',
      data: { expiresAt: 1_700_000_000, expiresInSeconds: 600 },
    });

    await controller.sendOtp(undefined, {
      purpose: OtpPurpose.PASSWORD_RESET,
      channel: OtpChannel.EMAIL,
      email: 'user@example.com',
    });

    expect(verificationClient.sendOtp).toHaveBeenCalledWith({
      subject: 'user@example.com',
      purpose: OtpPurpose.PASSWORD_RESET,
      channel: OtpChannel.EMAIL,
    });
  });

  it('rejects protected purposes without auth', async () => {
    await expect(
      controller.sendOtp(undefined, {
        purpose: OtpPurpose.EMAIL_VERIFY,
        channel: OtpChannel.EMAIL,
        email: 'user@example.com',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
