import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationSendEvent } from '@kritly/common';
import { Prisma } from '@prisma/client';
import { ChannelRegistry } from '../channels/channel.registry';
import { TemplateCacheService } from '../templates/template-cache.service';
import { TemplateEngineService } from '../templates/template-engine.service';
import { DeliveryRepository } from './delivery.repository';

export class NonRetryableNotificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NonRetryableNotificationError';
  }
}

export class RetryableNotificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RetryableNotificationError';
  }
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly deliveryRepository: DeliveryRepository,
    private readonly templateCacheService: TemplateCacheService,
    private readonly templateEngineService: TemplateEngineService,
    private readonly channelRegistry: ChannelRegistry,
  ) {}

  async process(event: NotificationSendEvent): Promise<void> {
    let deliveryId: string | undefined;

    if (event.idempotencyKey) {
      const existing = await this.deliveryRepository.findByIdempotencyKey(event.idempotencyKey);
      if (existing && (existing.status === 'sent' || existing.status === 'skipped')) {
        this.logger.debug(`Skipping duplicate notification: ${event.idempotencyKey}`);
        return;
      }
      if (existing) {
        deliveryId = existing.id;
      }
    }

    const delivery = deliveryId
      ? { id: deliveryId }
      : await this.deliveryRepository.createPending(event);

    try {
      const template = await this.templateCacheService.getTemplate(event.templateKey, event.channel);
      if (!template) {
        throw new NonRetryableNotificationError(`Template not found: ${event.templateKey}/${event.channel}`);
      }

      const renderedTemplate = this.templateEngineService.render(template, event.data);
      const channel = this.channelRegistry.get(event.channel);
      const result = await channel.send({
        to: event.recipient,
        subject: renderedTemplate.subject,
        bodyText: renderedTemplate.bodyText,
        bodyHtml: renderedTemplate.bodyHtml,
      });

      if (!result.success) {
        throw new RetryableNotificationError(result.error ?? 'Channel delivery failed');
      }

      await this.deliveryRepository.markSent(delivery.id, {
        input: event.data,
        rendered: renderedTemplate,
        providerMessageId: result.providerMessageId,
      } as unknown as Prisma.InputJsonValue);

      this.logger.log(
        `Notification sent (${event.templateKey} → ${event.recipient}) deliveryId=${delivery.id}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      await this.deliveryRepository.markFailed(delivery.id, message);

      if (
        error instanceof NonRetryableNotificationError ||
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw new NonRetryableNotificationError(message);
      }

      throw new RetryableNotificationError(message);
    }
  }
}
