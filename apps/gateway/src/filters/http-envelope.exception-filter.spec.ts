import { ArgumentsHost, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { fail } from '@kritly/common';
import { HttpEnvelopeExceptionFilter } from './http-envelope.exception-filter';

describe('HttpEnvelopeExceptionFilter', () => {
  const logger = { error: jest.fn(), info: jest.fn(), warn: jest.fn() };
  const filter = new HttpEnvelopeExceptionFilter(logger as never);

  it('maps Nest HTTP exceptions to the REST error envelope', () => {
    const send = jest.fn();
    const status = jest.fn().mockReturnValue({ send });
    const host = {
      getType: () => 'http',
      switchToHttp: () => ({
        getResponse: () => ({ status }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(new UnauthorizedException('Invalid token'), host);

    expect(status).toHaveBeenCalledWith(401);
    expect(send).toHaveBeenCalledWith(fail('Invalid token', 401));
  });

  it('maps unknown errors to 500 envelope', () => {
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const send = jest.fn();
    const status = jest.fn().mockReturnValue({ send });
    const host = {
      getType: () => 'http',
      switchToHttp: () => ({
        getResponse: () => ({ status }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(new Error('boom'), host);

    process.env.NODE_ENV = previousEnv;

    expect(logger.error).toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(send).toHaveBeenCalledWith(fail('Internal server error', 500));
  });
});
