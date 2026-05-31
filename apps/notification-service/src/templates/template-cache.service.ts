import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationChannel, NotificationTemplate } from '@prisma/client';
import { RedisService } from '../redis/redis.service';
import { TemplateRepository } from './template.repository';

@Injectable()
export class TemplateCacheService {
  constructor(
    private readonly redisService: RedisService,
    private readonly templateRepository: TemplateRepository,
    private readonly configService: ConfigService,
  ) {}

  async getTemplate(key: string, channel: NotificationChannel): Promise<NotificationTemplate | null> {
    const cacheKey = this.buildCacheKey(key, channel);

    if (this.redisService.isAvailable()) {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as NotificationTemplate;
      }
    }

    const template = await this.templateRepository.findActive(key, channel);
    if (!template) {
      return null;
    }

    if (this.redisService.isAvailable()) {
      const ttl = this.configService.get<number>('notification.templateCacheTtlSeconds') ?? 1800;
      await this.redisService.set(cacheKey, JSON.stringify(template), ttl);
    }

    return template;
  }

  async invalidate(key: string, channel: NotificationChannel, version?: number): Promise<void> {
    if (!this.redisService.isAvailable()) {
      return;
    }

    if (version != null) {
      await this.redisService.delete(this.buildCacheKey(key, channel, version));
      return;
    }

    await this.redisService.delete(this.buildCacheKey(key, channel));
  }

  private buildCacheKey(key: string, channel: NotificationChannel, version?: number): string {
    const suffix = version != null ? `:v${version}` : '';
    return `template:${channel}:${key}${suffix}`;
  }
}
