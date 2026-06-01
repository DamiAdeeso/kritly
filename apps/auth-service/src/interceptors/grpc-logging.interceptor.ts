import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { tap } from 'rxjs/operators';

@Injectable()
export class GrpcLoggingInterceptor implements NestInterceptor {
  constructor(@InjectPinoLogger(GrpcLoggingInterceptor.name) private readonly logger: PinoLogger) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    if (context.getType() !== 'rpc') {
      return next.handle();
    }

    const handler = context.getHandler().name;
    const data = context.switchToRpc().getData<Record<string, unknown>>();
    const email = typeof data.email === 'string' ? data.email : undefined;

    this.logger.info({ handler, email, userId: data.userId }, 'gRPC request received');

    return next.handle().pipe(
      tap((response) => {
        this.logger.info({ handler, email, response }, 'gRPC response');
      }),
    );
  }
}
