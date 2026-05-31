import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

enum ServingStatus {
  SERVING = 1,
}

@Controller()
export class HealthGrpcController {
  @GrpcMethod('Health', 'Check')
  check(): { status: ServingStatus } {
    return { status: ServingStatus.SERVING };
  }
}
