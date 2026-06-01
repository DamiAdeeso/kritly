import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthGatewayController } from './auth.gateway.controller';
import { AuthClientService } from '../services/auth-client.service';
import { VerificationClientService } from '../services/verification-client.service';

describe('AuthGatewayController', () => {
  let controller: AuthGatewayController;
  let authClient: jest.Mocked<AuthClientService>;
  let verificationClient: jest.Mocked<VerificationClientService>;

  beforeEach(async () => {
    authClient = {
      register: jest.fn(),
      login: jest.fn(),
      socialLogin: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
      validateToken: jest.fn(),
      resetPassword: jest.fn(),
      changePassword: jest.fn(),
      onModuleInit: jest.fn(),
    } as unknown as jest.Mocked<AuthClientService>;

    verificationClient = {
      sendOtp: jest.fn(),
      verifyOtp: jest.fn(),
      validateVerificationToken: jest.fn(),
      onModuleInit: jest.fn(),
    } as unknown as jest.Mocked<VerificationClientService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthGatewayController],
      providers: [
        { provide: AuthClientService, useValue: authClient },
        { provide: VerificationClientService, useValue: verificationClient },
      ],
    }).compile();

    controller = module.get<AuthGatewayController>(AuthGatewayController);
  });

  it('delegates registration to auth client', async () => {
    authClient.register.mockResolvedValue({
      statusCode: 201,
      message: 'User registered successfully',
      data: {
        accessToken: 'token',
        refreshToken: 'refresh',
        userId: 'user-1',
        email: 'user@example.com',
      },
    });

    const dto = {
      email: 'user@example.com',
      password: 'Password123',
      username: 'user123',
      dateOfBirth: '1990-01-15',
      verificationToken: 'verification-token',
    };

    await controller.register(dto);

    expect(authClient.register).toHaveBeenCalledWith(dto);
  });

  it('delegates password reset OTP request to verification client', async () => {
    verificationClient.sendOtp.mockResolvedValue({
      statusCode: 200,
      message: 'Verification code sent',
      data: { expiresAt: 123, expiresInSeconds: 600 },
    });

    await controller.requestPasswordReset({ email: 'user@example.com' });

    expect(verificationClient.sendOtp).toHaveBeenCalledWith({
      subject: 'user@example.com',
      purpose: 'password_reset',
      channel: 'email',
    });
  });

  it('forwards verification token when confirming password reset', async () => {
    authClient.resetPassword.mockResolvedValue({
      statusCode: 200,
      message: 'Password reset successfully',
      data: {},
    });

    await controller.confirmPasswordReset('verification-token', {
      email: 'user@example.com',
      newPassword: 'NewPassword123',
    });

    expect(authClient.resetPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      newPassword: 'NewPassword123',
      verificationToken: 'verification-token',
    });
  });

  it('delegates login and returns auth client response', async () => {
    authClient.login.mockResolvedValue({
      statusCode: 401,
      message: 'Invalid credentials',
      data: null,
    });

    const result = await controller.login({
      email: 'user@example.com',
      password: 'wrong',
    });

    expect(result.statusCode).toBe(401);
    expect(authClient.login).toHaveBeenCalled();
  });

  it('rejects validateToken when authorization header is missing', async () => {
    await expect(controller.validateToken(undefined)).rejects.toThrow(UnauthorizedException);
  });
});
