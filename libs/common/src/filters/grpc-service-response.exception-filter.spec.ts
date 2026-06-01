import { ArgumentsHost, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { lastValueFrom, Observable } from 'rxjs';
import { ServiceResponse } from '../dto/common.dto';
import { GrpcServiceResponseExceptionFilter } from './grpc-service-response.exception-filter';

describe('GrpcServiceResponseExceptionFilter', () => {
  const filter = new GrpcServiceResponseExceptionFilter();

  const rpcHost = {
    getType: () => 'rpc',
  } as ArgumentsHost;

  async function resolve(
    result: ServiceResponse<null> | Observable<ServiceResponse<null>>,
  ): Promise<ServiceResponse<null>> {
    return result instanceof Observable ? lastValueFrom(result) : result;
  }

  it('maps HttpException to fail envelope', async () => {
    const result = await resolve(
      filter.catch(new BadRequestException('Invalid input'), rpcHost),
    );

    expect(result).toEqual({
      statusCode: 400,
      message: 'Invalid input',
      data: null,
    });
  });

  it('maps unknown errors to 500 fail envelope', async () => {
    const result = await resolve(filter.catch(new Error('Unexpected failure'), rpcHost));

    expect(result).toEqual({
      statusCode: 500,
      message: 'Unexpected failure',
      data: null,
    });
  });

  it('preserves HttpException status codes', async () => {
    const result = await resolve(
      filter.catch(new UnauthorizedException('Invalid credentials'), rpcHost),
    );

    expect(result).toEqual({
      statusCode: 401,
      message: 'Invalid credentials',
      data: null,
    });
  });

  it('rethrows for non-rpc contexts', () => {
    const httpHost = { getType: () => 'http' } as ArgumentsHost;
    const error = new Error('Not RPC');

    expect(() => filter.catch(error, httpHost)).toThrow(error);
  });

  it('maps HttpException object responses using exception message', async () => {
    const result = await resolve(
      filter.catch(
        new BadRequestException({
          message: ['email must be an email'],
          error: 'Bad Request',
        }),
        rpcHost,
      ),
    );

    expect(result.statusCode).toBe(400);
    expect(typeof result.message).toBe('string');
    expect(result.data).toBeNull();
  });
});
