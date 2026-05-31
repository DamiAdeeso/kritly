import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AUTH_CONSTANTS } from '@kritly/common';
import { RedisService } from './redis.service';

@Injectable()
export class LoginLockoutService {
  constructor(private readonly redisService: RedisService) {}

  private getKey(email: string): string {
    return `login:attempts:${email.toLowerCase()}`;
  }

  async assertNotLocked(email: string): Promise<void> {
    const attempts = await this.redisService.get(this.getKey(email));
    if (attempts && Number.parseInt(attempts, 10) >= AUTH_CONSTANTS.MAX_LOGIN_ATTEMPTS) {
      throw new HttpException(
        'Too many login attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async recordFailedAttempt(email: string): Promise<void> {
    await this.redisService.increment(this.getKey(email), AUTH_CONSTANTS.LOCKOUT_DURATION);
  }

  async clearAttempts(email: string): Promise<void> {
    await this.redisService.delete(this.getKey(email));
  }
}
