import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ok, ServiceResponse } from '@kritly/common';

@ApiTags('Gateway')
@Controller('api')
export class GatewayController {
  @SkipThrottle()
  @Get('health')
  @ApiOperation({ summary: 'Health check (REST envelope)' })
  @ApiResponse({ status: 200, description: 'Gateway is healthy' })
  healthCheck(): ServiceResponse<{ status: string; timestamp: string }> {
    return ok('Gateway is healthy', {
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  }
}
