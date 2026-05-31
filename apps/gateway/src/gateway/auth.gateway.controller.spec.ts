import { Test, TestingModule } from '@nestjs/testing';
import { AuthGatewayController } from './auth.gateway.controller';
import { AuthClientService } from '../services/auth-client.service';
import { VerificationClientService } from '../services/verification-client.service';
import { VerificationGuard } from '../guards/verification.guard';
import { PasswordResetGuard } from '../guards/password-reset.guard';

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
        {
          provide: VerificationGuard,
          useValue: { canActivate: jest.fn().mockResolvedValue(true) },
        },
        {
          provide: PasswordResetGuard,
          useValue: { canActivate: jest.fn().mockResolvedValue(true) },
        },
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
      firstName: 'Test',
      lastName: 'User',
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
});
