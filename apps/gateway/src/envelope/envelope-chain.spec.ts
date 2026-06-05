import { lastValueFrom, Observable } from 'rxjs';

import { CallHandler, ExecutionContext, HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';

import { APP_INTERCEPTOR } from '@nestjs/core';

import { Test, TestingModule } from '@nestjs/testing';

import { ClientError, isServiceResponse, runGrpcHandler, Status, clientErrorToHttpEnvelope } from '@kritly/common';

import { AuthGatewayController } from '../gateway/auth.gateway.controller';

import { AuthClientService } from '../services/auth-client.service';

import { VerificationClientService } from '../services/verification-client.service';

import { ServiceResponseInterceptor } from '../interceptors/service-response.interceptor';

import { JwtTokenService } from '../auth/jwt-token.service';

import { bypassJwtAuthGuard } from '../auth/test-auth.util';



/**

 * Contract test: native gRPC status on the wire → gateway HTTP error envelope → HTTP status.

 */

describe('Envelope chain (gRPC status → gateway envelope → HTTP status)', () => {

  let controller: AuthGatewayController;

  let authClient: jest.Mocked<Pick<AuthClientService, 'login'>>;

  let interceptor: ServiceResponseInterceptor;



  beforeEach(async () => {

    authClient = {

      login: jest.fn(),

    };



    const module: TestingModule = await bypassJwtAuthGuard(

      Test.createTestingModule({

        controllers: [AuthGatewayController],

        providers: [

          { provide: AuthClientService, useValue: authClient },

          { provide: VerificationClientService, useValue: {} },

          { provide: JwtTokenService, useValue: {} },

          ServiceResponseInterceptor,

          {

            provide: APP_INTERCEPTOR,

            useClass: ServiceResponseInterceptor,

          },

        ],

      }),

    ).compile();



    controller = module.get(AuthGatewayController);

    interceptor = module.get(ServiceResponseInterceptor);

  });



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

    await expect(

      runGrpcHandler(async () => {

        throw new UnauthorizedException('Invalid credentials');

      }),

    ).rejects.toMatchObject({ code: Status.UNAUTHENTICATED });



    const envelope = clientErrorToHttpEnvelope(

      new ClientError('/auth.AuthService/Login', Status.UNAUTHENTICATED, 'Invalid credentials'),

    );



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

    await expect(

      runGrpcHandler(async () => {

        throw new HttpException('Too many login attempts. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);

      }),

    ).rejects.toMatchObject({ code: Status.RESOURCE_EXHAUSTED });



    const envelope = clientErrorToHttpEnvelope(

      new ClientError(

        '/auth.AuthService/Login',

        Status.RESOURCE_EXHAUSTED,

        'Too many login attempts. Please try again later.',

      ),

    );



    authClient.login.mockResolvedValue(envelope);

    const controllerBody = await controller.login({

      email: 'user@example.com',

      password: 'Password123',

    });



    const http = await applyHttpInterceptor(controllerBody);

    expect(http.status).toHaveBeenCalledWith(429);

    expect(http.body).toEqual(envelope);

  });



  it('maps successful gRPC auth data to HTTP envelope with 200', async () => {

    const authData = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      userId: 'user-1',
      email: 'user@example.com',
    };

    const envelope = {
      statusCode: 200,
      message: 'Login successful',
      data: authData,
    };

    authClient.login.mockResolvedValue(authData);

    const controllerBody = await controller.login({

      email: 'user@example.com',

      password: 'Password123',

    });



    const http = await applyHttpInterceptor(controllerBody);

    expect(http.status).toHaveBeenCalledWith(200);

    expect(http.body).toEqual(envelope);

  });

});


