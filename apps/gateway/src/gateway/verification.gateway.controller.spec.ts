import { Test, TestingModule } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { fail, OtpPurpose, OtpChannel } from '@kritly/common';
import { VerificationGatewayController } from './verification.gateway.controller';
import { AuthClientService } from '../services/auth-client.service';
import { VerificationClientService } from '../services/verification-client.service';
import { JwtTokenService } from '../auth/jwt-token.service';
import { bypassJwtAuthGuard } from '../auth/test-auth.util';

describe('VerificationGatewayController', () => {
  let controller: VerificationGatewayController;
  let authClient: jest.Mocked<AuthClientService>;
  let verificationClient: jest.Mocked<VerificationClientService>;
  let jwtTokenService: jest.Mocked<JwtTokenService>;

  const user = {
    userId: 'user-1',
    email: 'user@example.com',
    role: 'USER',
  };

  beforeEach(async () => {
    authClient = {
      checkEmailAvailability: jest.fn(),
    } as unknown as jest.Mocked<AuthClientService>;

    verificationClient = {
      sendOtp: jest.fn(),
      verifyOtp: jest.fn(),
    } as unknown as jest.Mocked<VerificationClientService>;

    jwtTokenService = {
      extractBearerToken: jest.fn(),
      verifyFromAuthHeader: jest.fn(),
      verifyAccessToken: jest.fn(),
      tryVerifyFromAuthHeader: jest.fn(),
    } as unknown as jest.Mocked<JwtTokenService>;

    const module: TestingModule = await bypassJwtAuthGuard(
      Test.createTestingModule({
        controllers: [VerificationGatewayController],
        providers: [
          { provide: AuthClientService, useValue: authClient },
          { provide: VerificationClientService, useValue: verificationClient },
          { provide: JwtTokenService, useValue: jwtTokenService },
          {
            provide: getLoggerToken(VerificationGatewayController.name),
            useValue: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
          },
        ],
      }),
    ).compile();

    controller = module.get<VerificationGatewayController>(VerificationGatewayController);
  });

  it('sends OTP for authenticated users', async () => {
    jwtTokenService.extractBearerToken.mockReturnValue('token');
    verificationClient.sendOtp.mockResolvedValue({
      expiresAt: 1_700_000_000,
      expiresInSeconds: 600,
    });

    await controller.sendOtp('Bearer token', user, {
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
    jwtTokenService.extractBearerToken.mockReturnValue(undefined);
    verificationClient.sendOtp.mockResolvedValue({
      expiresAt: 1_700_000_000,
      expiresInSeconds: 600,
    });

    await controller.sendOtp(undefined, undefined, {
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
    jwtTokenService.extractBearerToken.mockReturnValue(undefined);
    authClient.checkEmailAvailability.mockResolvedValue({ isAvailable: true });
    verificationClient.sendOtp.mockResolvedValue({
      expiresAt: 1_700_000_000,
      expiresInSeconds: 600,
    });

    await controller.sendOtp(undefined, undefined, {
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
    jwtTokenService.extractBearerToken.mockReturnValue(undefined);
    authClient.checkEmailAvailability.mockResolvedValue({ isAvailable: false });

    const result = await controller.sendOtp(undefined, undefined, {
      purpose: OtpPurpose.EMAIL_VERIFY,
      channel: OtpChannel.EMAIL,
      email: 'user@example.com',
    });

    expect(result).toEqual(fail('Email is already registered', 400));
  });

  it('rejects protected purposes without auth or email', async () => {
    jwtTokenService.extractBearerToken.mockReturnValue(undefined);

    const result = await controller.sendOtp(undefined, undefined, {
      purpose: OtpPurpose.SENSITIVE_ACTION,
      channel: OtpChannel.EMAIL,
    });

    expect(result).toEqual(fail('Authentication required for this verification purpose', 401));
  });

  it('returns error envelope for invalid bearer token when header is present', async () => {
    jwtTokenService.extractBearerToken.mockReturnValue('bad-token');

    const result = await controller.sendOtp('Bearer bad-token', undefined, {
      purpose: OtpPurpose.EMAIL_VERIFY,
      channel: OtpChannel.EMAIL,
    });

    expect(result).toEqual(fail('Invalid token', 401));
  });
});
