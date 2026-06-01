import { lastValueFrom, Observable } from 'rxjs';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';
import { GrpcServiceResponseExceptionFilter } from '@kritly/common';
import { PinoLogger } from 'nestjs-pino';
import { AuthGrpcController } from './auth.grpc.controller';
import { AuthService } from './auth.service';

describe('AuthGrpcController', () => {
  let controller: AuthGrpcController;
  let authService: jest.Mocked<Pick<AuthService, 'login' | 'register'>>;
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as PinoLogger;
  const filter = new GrpcServiceResponseExceptionFilter();
  const rpcHost = { getType: () => 'rpc' } as ArgumentsHost;

  beforeEach(() => {
    authService = {
      login: jest.fn(),
      register: jest.fn(),
    };
    controller = new AuthGrpcController(authService as unknown as AuthService, logger);
  });

  it('delegates login to AuthService', async () => {
    authService.login.mockResolvedValue({
      statusCode: 200,
      message: 'Login successful',
      data: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        userId: 'user-1',
        email: 'user@example.com',
      },
    });

    const result = await controller.login({
      email: 'user@example.com',
      password: 'Password123',
    });

    expect(authService.login).toHaveBeenCalled();
    expect(result.statusCode).toBe(200);
  });

  it('maps login failures to fail envelope through the global filter contract', async () => {
    authService.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

    await expect(
      controller.login({ email: 'user@example.com', password: 'wrong' }),
    ).rejects.toThrow(UnauthorizedException);

    const envelope = await lastValueFrom(
      filter.catch(new UnauthorizedException('Invalid credentials'), rpcHost) as Observable<unknown>,
    );

    expect(envelope).toEqual({
      statusCode: 401,
      message: 'Invalid credentials',
      data: null,
    });
  });

  it('maps validation failures to fail envelope through the global filter contract', async () => {
    authService.register.mockRejectedValue(new BadRequestException('Username is already taken'));

    const envelope = await lastValueFrom(
      filter.catch(new BadRequestException('Username is already taken'), rpcHost) as Observable<unknown>,
    );

    expect(envelope).toEqual({
      statusCode: 400,
      message: 'Username is already taken',
      data: null,
    });
  });
});
