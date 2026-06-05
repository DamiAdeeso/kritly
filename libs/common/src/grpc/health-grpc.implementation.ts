import { Injectable } from '@nestjs/common';
import {
  HealthCheckResponse_ServingStatus,
  HealthServiceImplementation,
} from '../generated/health';

@Injectable()
export class HealthGrpcImplementation implements HealthServiceImplementation {
  async check(): Promise<{ status: HealthCheckResponse_ServingStatus }> {
    return { status: HealthCheckResponse_ServingStatus.SERVING };
  }
}
