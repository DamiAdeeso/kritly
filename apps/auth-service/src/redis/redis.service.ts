import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const host = this.configService.get<string>('redis.host') ?? this.configService.get<string>('REDIS_HOST') ?? 'localhost';
    const port = this.configService.get<number>('redis.port') ?? Number(this.configService.get<string>('REDIS_PORT') ?? 6379);
    const password = this.configService.get<string>('redis.password') ?? this.configService.get<string>('REDIS_PASSWORD');
    const useTls = this.shouldUseTls(redisUrl);
    const options: RedisOptions = {
      tls: useTls ? {} : undefined,
      connectTimeout: 5_000,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    };

    let pendingClient: Redis | undefined;

    try {
      pendingClient = redisUrl
        ? new Redis(redisUrl, options)
        : new Redis({
            ...options,
            host,
            port,
            password: password || undefined,
          });

      pendingClient.on('error', (error) => {
        this.logger.debug(`Redis connection error: ${error.message}`);
      });

      await pendingClient.ping();
      this.client = pendingClient;
      this.logger.log('Connected to Redis');
    } catch (error) {
      pendingClient?.disconnect();
      this.logger.warn(
        `Redis unavailable (${error instanceof Error ? error.message : 'unknown error'}). Login lockout is disabled.`,
      );
      this.client = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.quit();
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) {
      return null;
    }

    return this.client.get(key);
  }

  async increment(key: string, ttlMs: number): Promise<number> {
    if (!this.client) {
      return 0;
    }

    const count = await this.client.incr(key);
    if (count === 1) {
      await this.client.pexpire(key, ttlMs);
    }

    return count;
  }

  async delete(key: string): Promise<void> {
    if (!this.client) {
      return;
    }

    await this.client.del(key);
  }

  private shouldUseTls(redisUrl: string | undefined): boolean {
    if (redisUrl?.startsWith('rediss://')) {
      return true;
    }

    if (redisUrl?.startsWith('redis://')) {
      return this.configService.get<string>('REDIS_TLS') === 'true';
    }

    const tlsConfig = this.configService.get('redis.tls');
    return this.configService.get<string>('REDIS_TLS') === 'true' || tlsConfig != null;
  }
}
