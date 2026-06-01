import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { getLoggerToken } from 'nestjs-pino';
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
      checkEmailAvailability: jest.fn(),
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
        {
          provide: getLoggerToken(VerificationGatewayController.name),
          useValue: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
        },
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

  it('allows signup email verify OTP without auth when email is available', async () => {
    authClient.checkEmailAvailability.mockResolvedValue({
      statusCode: 200,
      message: 'Email is available',
      data: { isAvailable: true },
    });
    verificationClient.sendOtp.mockResolvedValue({
      statusCode: 200,
      message: 'Verification code sent',
      data: { expiresAt: 1_700_000_000, expiresInSeconds: 600 },
    });

    await controller.sendOtp(undefined, {
      purpose: OtpPurpose.EMAIL_VERIFY,
      channel: OtpChannel.EMAIL,
      email: 'new@example.com',
    });

    expect(authClient.checkEmailAvailability).toHaveBeenCalledWith({ email: 'new@example.com' });
    expect(verificationClient.sendOtp).toHaveBeenCalledWith({
      subject: 'new@example.com',
      purpose: OtpPurpose.EMAIL_VERIFY,
      channel: OtpChannel.EMAIL,
    });
  });

  it('rejects signup email verify when email is already registered', async () => {
    authClient.checkEmailAvailability.mockResolvedValue({
      statusCode: 200,
      message: 'Email is already registered',
      data: { isAvailable: false },
    });

    await expect(
      controller.sendOtp(undefined, {
        purpose: OtpPurpose.EMAIL_VERIFY,
        channel: OtpChannel.EMAIL,
        email: 'user@example.com',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects protected purposes without auth or email', async () => {
    await expect(
      controller.sendOtp(undefined, {
        purpose: OtpPurpose.SENSITIVE_ACTION,
        channel: OtpChannel.EMAIL,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
