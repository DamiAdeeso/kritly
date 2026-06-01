import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { isServiceResponse } from '@kritly/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FastifyReply } from 'fastify';

@Injectable()
export class ServiceResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const response = context.switchToHttp().getResponse<FastifyReply>();

    return next.handle().pipe(
      map((body: unknown) => {
        if (isServiceResponse(body)) {
          response.status(body.statusCode);
        }

        return body;
      }),
    );
  }
}
