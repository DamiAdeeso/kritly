import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { fail, getHttpExceptionMessage } from '@kritly/common';
import { FastifyReply } from 'fastify';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

/** Map Nest HTTP exceptions (guards, validation, etc.) to the standard REST error envelope. */
@Injectable()
@Catch()
export class HttpEnvelopeExceptionFilter implements ExceptionFilter {
  constructor(@InjectPinoLogger(HttpEnvelopeExceptionFilter.name) private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') {
      throw exception;
    }

    const response = host.switchToHttp().getResponse<FastifyReply>();

    if (exception instanceof HttpException) {
      const body = fail(getHttpExceptionMessage(exception), exception.getStatus());
      response.status(body.statusCode).send(body);
      return;
    }

    this.logger.error({ err: exception }, 'Unhandled HTTP exception');

    const isProduction = process.env.NODE_ENV === 'production';
    const message = isProduction
      ? 'Internal server error'
      : exception instanceof Error
        ? exception.message
        : 'Internal server error';

    const body = fail(message, HttpStatus.INTERNAL_SERVER_ERROR);
    response.status(body.statusCode).send(body);
  }
}
