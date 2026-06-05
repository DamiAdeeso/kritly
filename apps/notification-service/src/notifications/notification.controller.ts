import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { INTEGRATION_EVENT_PATTERN, IntegrationEvent } from '@kritly/common';
import {
  NonRetryableNotificationError,
  NotificationService,
  RetryableNotificationError,
} from './notification.service';
import { NotificationRouter } from './notification-router.service';

@Controller()
export class NotificationController {
  constructor(
    @InjectPinoLogger(NotificationController.name) private readonly logger: PinoLogger,
    private readonly notificationRouter: NotificationRouter,
    private readonly notificationService: NotificationService,
  ) {}

  @EventPattern(INTEGRATION_EVENT_PATTERN)
  async handleIntegrationEvent(
    @Payload() event: IntegrationEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();

    this.logger.info(
      {
        eventType: event.type,
        source: event.source,
        idempotencyKey: event.idempotencyKey ?? null,
        correlationId: event.correlationId ?? null,
      },
      'integration event received',
    );

    try {
      const notification = this.notificationRouter.resolve(event);
      if (!notification) {
        this.logger.debug({ eventType: event.type }, 'no notification route for event');
        channel.ack(originalMessage);
        return;
      }

      await this.notificationService.process(notification);
      channel.ack(originalMessage);
    } catch (error) {
      if (error instanceof NonRetryableNotificationError) {
        this.logger.warn(
          { eventType: event.type, error: error.message },
          'non-retryable notification error',
        );
        channel.ack(originalMessage);
        return;
      }

      if (error instanceof RetryableNotificationError) {
        this.logger.warn(
          { eventType: event.type, error: error.message },
          'retryable notification error',
        );
        channel.nack(originalMessage, false, true);
        return;
      }

      this.logger.error(
        {
          eventType: event.type,
          error: error instanceof Error ? error.message : 'unknown',
        },
        'unexpected notification error',
      );
      channel.nack(originalMessage, false, true);
    }
  }
}
