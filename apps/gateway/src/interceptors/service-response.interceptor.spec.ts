import { ServiceResponseInterceptor } from './service-response.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { lastValueFrom } from 'rxjs';

describe('ServiceResponseInterceptor', () => {
  const interceptor = new ServiceResponseInterceptor();

  it('maps service response statusCode to HTTP status', async () => {
    const status = jest.fn();
    const context = {
      getType: () => 'http',
      switchToHttp: () => ({
        getResponse: () => ({ status }),
      }),
    } as unknown as ExecutionContext;

    const handler: CallHandler = {
      handle: () =>
        of({
          statusCode: 401,
          message: 'Invalid credentials',
          data: null,
        }),
    };

    const body = await lastValueFrom(interceptor.intercept(context, handler));

    expect(status).toHaveBeenCalledWith(401);
    expect(body).toEqual({
      statusCode: 401,
      message: 'Invalid credentials',
      data: null,
    });
  });

  it('leaves non-envelope responses unchanged', async () => {
    const status = jest.fn();
    const context = {
      getType: () => 'http',
      switchToHttp: () => ({
        getResponse: () => ({ status }),
      }),
    } as unknown as ExecutionContext;

    const handler: CallHandler = {
      handle: () => of({ status: 'ok' }),
    };

    const body = await lastValueFrom(interceptor.intercept(context, handler));

    expect(status).not.toHaveBeenCalled();
    expect(body).toEqual({ status: 'ok' });
  });

  it('sets HTTP status for successful service envelopes', async () => {
    const status = jest.fn();
    const context = {
      getType: () => 'http',
      switchToHttp: () => ({
        getResponse: () => ({ status }),
      }),
    } as unknown as ExecutionContext;

    const handler: CallHandler = {
      handle: () =>
        of({
          statusCode: 201,
          message: 'Created',
          data: { id: '1' },
        }),
    };

    await lastValueFrom(interceptor.intercept(context, handler));

    expect(status).toHaveBeenCalledWith(201);
  });

  it('skips non-http contexts', async () => {
    const handler: CallHandler = {
      handle: () => of({ statusCode: 401, message: 'Unauthorized', data: null }),
    };
    const context = {
      getType: () => 'rpc',
      switchToHttp: () => ({
        getResponse: () => ({ status: jest.fn() }),
      }),
    } as unknown as ExecutionContext;

    const body = await lastValueFrom(interceptor.intercept(context, handler));

    expect(body).toEqual({ statusCode: 401, message: 'Unauthorized', data: null });
  });
});
