import { Test, TestingModule } from '@nestjs/testing';
import { AuthProvider, fail } from '@kritly/common';
import { AuthGatewayController } from './auth.gateway.controller';
import { AuthClientService } from '../services/auth-client.service';
import { JwtTokenService } from '../auth/jwt-token.service';
import { bypassJwtAuthGuard } from '../auth/test-auth.util';

describe('AuthGatewayController', () => {
  let controller: AuthGatewayController;
  let authClient: jest.Mocked<AuthClientService>;
  let jwtTokenService: jest.Mocked<JwtTokenService>;

  beforeEach(async () => {
    authClient = {
      register: jest.fn(),
      login: jest.fn(),
      loginSession: jest.fn(),
      socialLogin: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      changePassword: jest.fn(),
      checkEmailAvailability: jest.fn(),
      onModuleInit: jest.fn(),
    } as unknown as jest.Mocked<AuthClientService>;

    jwtTokenService = {
      verifyFromAuthHeader: jest.fn(),
      extractBearerToken: jest.fn(),
      verifyAccessToken: jest.fn(),
      tryVerifyFromAuthHeader: jest.fn(),
    } as unknown as jest.Mocked<JwtTokenService>;

    const module: TestingModule = await bypassJwtAuthGuard(
      Test.createTestingModule({
        controllers: [AuthGatewayController],
        providers: [
          { provide: AuthClientService, useValue: authClient },
          { provide: JwtTokenService, useValue: jwtTokenService },
        ],
      }),
    ).compile();

    controller = module.get<AuthGatewayController>(AuthGatewayController);
  });

  it('delegates registration to auth client', async () => {
    authClient.register.mockResolvedValue({
      accessToken: 'token',
      refreshToken: 'refresh',
      userId: 'user-1',
      email: 'user@example.com',
    });

    const dto = {
      email: 'user@example.com',
      password: 'Password123',
      username: 'user123',
      dateOfBirth: '1990-01-15',
    };

    await controller.register('verification-token', dto);

    expect(authClient.register).toHaveBeenCalledWith({
      ...dto,
      verificationToken: 'verification-token',
    });
  });

  it('forwards verification token when confirming password reset', async () => {
    authClient.resetPassword.mockResolvedValue({});

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

  it('delegates login session to auth client', async () => {
    authClient.loginSession.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      profile: {
        userId: 'user-1',
        email: 'user@example.com',
        username: 'user123',
        displayName: 'Test User',
      },
    });

    const result = await controller.loginSession({
      email: 'user@example.com',
      password: 'Password123',
    });

    expect(authClient.loginSession).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'Password123',
    });
    expect(result).toEqual({
      statusCode: 200,
      message: 'Login successful',
      data: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        profile: {
          userId: 'user-1',
          email: 'user@example.com',
          username: 'user123',
          displayName: 'Test User',
        },
      },
    });
  });

  it('login session passes through auth client errors', async () => {
    authClient.loginSession.mockResolvedValue(fail('Invalid credentials', 401));

    const result = await controller.loginSession({
      email: 'user@example.com',
      password: 'wrong',
    });

    expect(result.statusCode).toBe(401);
  });

  it('delegates social login to auth client', async () => {
    authClient.socialLogin.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      userId: 'user-1',
      email: 'user@example.com',
    });

    const dto = { provider: AuthProvider.GOOGLE, idToken: 'google-id-token' };
    const result = await controller.socialLogin(dto);

    expect(authClient.socialLogin).toHaveBeenCalledWith(dto);
    expect(result).toEqual({
      statusCode: 200,
      message: 'Social login successful',
      data: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        userId: 'user-1',
        email: 'user@example.com',
      },
    });
  });

  it('delegates refresh token to auth client', async () => {
    authClient.refreshToken.mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      userId: 'user-1',
      email: 'user@example.com',
    });

    const result = await controller.refreshToken({ refreshToken: 'refresh-token' });

    expect(authClient.refreshToken).toHaveBeenCalledWith({ refreshToken: 'refresh-token' });
    expect(result).toEqual({
      statusCode: 200,
      message: 'Token refreshed successfully',
      data: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        userId: 'user-1',
        email: 'user@example.com',
      },
    });
  });

  it('delegates logout to auth client', async () => {
    authClient.logout.mockResolvedValue({});

    const result = await controller.logout({ refreshToken: 'refresh-token' });

    expect(authClient.logout).toHaveBeenCalledWith({ refreshToken: 'refresh-token' });
    expect(result).toEqual({
      statusCode: 200,
      message: 'Logout successful',
      data: {},
    });
  });

  it('normalizes email and reports availability when email is free', async () => {
    authClient.checkEmailAvailability.mockResolvedValue({ isAvailable: true });

    const result = await controller.checkEmail({ email: '  User@Example.com  ' });

    expect(authClient.checkEmailAvailability).toHaveBeenCalledWith({ email: 'user@example.com' });
    expect(result).toEqual({
      statusCode: 200,
      message: 'Email is available',
      data: { isAvailable: true },
    });
  });

  it('reports taken email with distinct message', async () => {
    authClient.checkEmailAvailability.mockResolvedValue({ isAvailable: false });

    const result = await controller.checkEmail({ email: 'user@example.com' });

    expect(result).toEqual({
      statusCode: 200,
      message: 'Email is already registered',
      data: { isAvailable: false },
    });
  });

  it('validates token locally via JwtTokenService', async () => {
    jwtTokenService.tryVerifyFromAuthHeader.mockReturnValue({
      userId: 'user-1',
      email: 'user@example.com',
      role: 'USER',
    });

    const result = await controller.validateToken('Bearer access-token');

    expect(jwtTokenService.tryVerifyFromAuthHeader).toHaveBeenCalledWith('Bearer access-token');
    expect(result).toEqual({
      statusCode: 200,
      message: 'Token validation successful',
      data: {
        isValid: true,
        userId: 'user-1',
      },
    });
  });

  it('returns error envelope when validateToken header is missing', async () => {
    jwtTokenService.tryVerifyFromAuthHeader.mockReturnValue(undefined);
    jwtTokenService.extractBearerToken.mockReturnValue(undefined);

    const result = await controller.validateToken(undefined);

    expect(result.statusCode).toBe(401);
    expect(result.data).toBeNull();
  });

  it('returns invalid token message when bearer token is present but invalid', async () => {
    jwtTokenService.tryVerifyFromAuthHeader.mockReturnValue(undefined);
    jwtTokenService.extractBearerToken.mockReturnValue('bad-token');

    const result = await controller.validateToken('Bearer bad-token');

    expect(result).toEqual({
      statusCode: 401,
      message: 'Invalid token',
      data: null,
    });
  });

  it('forwards verification token when changing password', async () => {
    authClient.changePassword.mockResolvedValue({});

    const user = { userId: 'user-1', email: 'user@example.com', role: 'USER' };
    await controller.changePassword(user, 'verification-token', {
      currentPassword: 'OldPassword123',
      newPassword: 'NewPassword123',
    });

    expect(authClient.changePassword).toHaveBeenCalledWith({
      userId: 'user-1',
      currentPassword: 'OldPassword123',
      newPassword: 'NewPassword123',
      verificationToken: 'verification-token',
    });
  });
});