import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { AuthClientService } from '../services/auth-client.service';
import { HealthController } from '../health/health.controller';

@Module({
  controllers: [GatewayController, HealthController],
  providers: [AuthClientService],
  exports: [AuthClientService],
})
export class GatewayModule {}
