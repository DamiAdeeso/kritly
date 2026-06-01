import { lastValueFrom, Observable } from 'rxjs';
import { ArgumentsHost, CallHandler, ExecutionContext, HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { GrpcServiceResponseExceptionFilter, isServiceResponse } from '@kritly/common';
import { AuthGatewayController } from '../gateway/auth.gateway.controller';
import { AuthClientService } from '../services/auth-client.service';
import { VerificationClientService } from '../services/verification-client.service';
import { ServiceResponseInterceptor } from '../interceptors/service-response.interceptor';

/**
 * Contract test for the full envelope chain:
 * auth-service throw → gRPC filter envelope → gateway controller → HTTP interceptor status
 */
describe('Envelope chain (gRPC filter → gateway → HTTP status)', () => {
  const grpcFilter = new GrpcServiceResponseExceptionFilter();
  const rpcHost = { getType: () => 'rpc' } as ArgumentsHost;
  let controller: AuthGatewayController;
  let authClient: jest.Mocked<Pick<AuthClientService, 'login'>>;
  let interceptor: ServiceResponseInterceptor;

  beforeEach(async () => {
    authClient = {
      login: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthGatewayController],
      providers: [
        { provide: AuthClientService, useValue: authClient },
        { provide: VerificationClientService, useValue: {} },
        ServiceResponseInterceptor,
        {
          provide: APP_INTERCEPTOR,
          useClass: ServiceResponseInterceptor,
        },
      ],
    }).compile();

    controller = module.get(AuthGatewayController);
    interceptor = module.get(ServiceResponseInterceptor);
  });

  async function resolveGrpcEnvelope(exception: unknown) {
    return lastValueFrom(
      grpcFilter.catch(exception, rpcHost) as Observable<{
        statusCode: number;
        message: string;
        data: null;
      }>,
    );
  }

  async function applyHttpInterceptor(body: unknown) {
    const status = jest.fn();
    const context = {
      getType: () => 'http',
      switchToHttp: () => ({
        getResponse: () => ({ status }),
      }),
    } as unknown as ExecutionContext;
    const handler: CallHandler = {
      handle: () => new Observable((subscriber) => {
        subscriber.next(body);
        subscriber.complete();
      }),
    };

    const result = await lastValueFrom(interceptor.intercept(context, handler));
    return { status, body: result };
  }

  it('maps unauthorized login failures to HTTP 401', async () => {
    const envelope = await resolveGrpcEnvelope(new UnauthorizedException('Invalid credentials'));

    expect(envelope).toEqual({
      statusCode: 401,
      message: 'Invalid credentials',
      data: null,
    });
    expect(isServiceResponse(envelope)).toBe(true);

    authClient.login.mockResolvedValue(envelope);
    const controllerBody = await controller.login({
      email: 'user@example.com',
      password: 'wrong-password',
    });
    expect(controllerBody).toEqual(envelope);

    const http = await applyHttpInterceptor(controllerBody);
    expect(http.status).toHaveBeenCalledWith(401);
    expect(http.body).toEqual(envelope);
  });

  it('maps login lockout failures to HTTP 429', async () => {
    const envelope = await resolveGrpcEnvelope(
      new HttpException('Too many login attempts. Please try again later.', HttpStatus.TOO_MANY_REQUESTS),
    );

    expect(envelope.statusCode).toBe(429);

    authClient.login.mockResolvedValue(envelope);
    const controllerBody = await controller.login({
      email: 'user@example.com',
      password: 'Password123',
    });

    const http = await applyHttpInterceptor(controllerBody);
    expect(http.status).toHaveBeenCalledWith(429);
    expect(http.body).toEqual(envelope);
  });

  it('maps successful auth envelopes to HTTP 200', async () => {
    const envelope = {
      statusCode: 200,
      message: 'Login successful',
      data: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        userId: 'user-1',
        email: 'user@example.com',
      },
    };

    authClient.login.mockResolvedValue(envelope);
    const controllerBody = await controller.login({
      email: 'user@example.com',
      password: 'Password123',
    });

    const http = await applyHttpInterceptor(controllerBody);
    expect(http.status).toHaveBeenCalledWith(200);
    expect(http.body).toEqual(envelope);
  });
});
