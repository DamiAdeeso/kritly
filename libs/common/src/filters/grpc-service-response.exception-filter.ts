import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { fail, ServiceResponse } from '../dto/common.dto';
import { getErrorMessage, getErrorStatus } from '../utils/service-response.util';

@Catch()
export class GrpcServiceResponseExceptionFilter implements ExceptionFilter {
  catch(
    exception: unknown,
    host: ArgumentsHost,
  ): ServiceResponse<null> | Observable<ServiceResponse<null>> {
    if (host.getType() !== 'rpc') {
      throw exception;
    }

    return of(
      fail(
        getErrorMessage(exception, 'Internal server error'),
        getErrorStatus(exception, 500),
      ),
    );
  }
}
