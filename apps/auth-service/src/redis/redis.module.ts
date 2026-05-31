import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { LoginLockoutService } from './login-lockout.service';

@Global()
@Module({
  providers: [RedisService, LoginLockoutService],
  exports: [RedisService, LoginLockoutService],
})
export class RedisModule {}
