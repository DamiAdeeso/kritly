import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { NotificationSendEvent, hashSubject } from '@kritly/common';
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
  constructor(
    @InjectPinoLogger(NotificationService.name) private readonly logger: PinoLogger,
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
        this.logger.debug(
          {
            idempotencyKey: event.idempotencyKey,
            deliveryId: existing.id,
            status: existing.status,
          },
          'skipping duplicate notification',
        );
        return;
      }
      if (existing) {
        deliveryId = existing.id;
      }
    }

    const delivery = deliveryId
      ? { id: deliveryId }
      : await this.deliveryRepository.createPending(event);

    this.logger.info(
      {
        deliveryId: delivery.id,
        templateKey: event.templateKey,
        channel: event.channel,
        recipientHash: hashSubject(event.recipient),
        idempotencyKey: event.idempotencyKey ?? null,
        source: event.source ?? null,
      },
      'processing notification',
    );

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

      this.logger.info(
        {
          deliveryId: delivery.id,
          templateKey: event.templateKey,
          channel: event.channel,
          recipientHash: hashSubject(event.recipient),
          providerMessageId: result.providerMessageId ?? null,
        },
        'notification sent',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      await this.deliveryRepository.markFailed(delivery.id, message);

      this.logger.warn(
        {
          deliveryId: delivery.id,
          templateKey: event.templateKey,
          channel: event.channel,
          recipientHash: hashSubject(event.recipient),
          error: message,
          retryable: !(error instanceof NonRetryableNotificationError),
        },
        'notification delivery failed',
      );

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
