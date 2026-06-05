import { UnauthorizedException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Status, wrapGrpcImplementation } from '@kritly/common';
import { AuthGrpcImplementation } from './auth.grpc.implementation';
import { AuthService } from './auth.service';
import { VerificationEnforcementService } from '../shared/verification-enforcement.service';

describe('AuthGrpcImplementation', () => {
  let implementation: AuthGrpcImplementation;
  let authService: jest.Mocked<Pick<AuthService, 'login' | 'loginSession' | 'register'>>;
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as PinoLogger;
  const verificationEnforcement = {
    requireVerificationToken: jest.fn(),
  } as unknown as VerificationEnforcementService;

  beforeEach(() => {
    authService = {
      login: jest.fn(),
      loginSession: jest.fn(),
      register: jest.fn(),
    };
    implementation = new AuthGrpcImplementation(authService as unknown as AuthService, verificationEnforcement, logger);
  });

  it('delegates login to AuthService', async () => {
    authService.login.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      userId: 'user-1',
      email: 'user@example.com',
    });

    const wrapped = wrapGrpcImplementation(implementation);
    const result = await wrapped.login({
      email: 'user@example.com',
      password: 'Password123',
    });

    expect(authService.login).toHaveBeenCalled();
    expect(result.accessToken).toBe('access-token');
  });

  it('delegates loginSession to AuthService', async () => {
    authService.loginSession.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      profile: { userId: 'user-1', displayName: 'Test User' },
    });

    const wrapped = wrapGrpcImplementation(implementation);
    const result = await wrapped.loginSession({
      email: 'user@example.com',
      password: 'Password123',
    });

    expect(authService.loginSession).toHaveBeenCalled();
    expect(result.profile?.displayName).toBe('Test User');
  });

  it('maps login failures to UNAUTHENTICATED', async () => {
    authService.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));
    const wrapped = wrapGrpcImplementation(implementation);

    await expect(
      wrapped.login({ email: 'user@example.com', password: 'wrong' }),
    ).rejects.toMatchObject({
      code: Status.UNAUTHENTICATED,
      details: 'Invalid credentials',
    });
  });
});
