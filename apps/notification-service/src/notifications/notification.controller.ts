import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { INTEGRATION_EVENT_PATTERN, IntegrationEvent } from '@kritly/common';
import {
  NonRetryableNotificationError,
  NotificationService,
  RetryableNotificationError,
} from './notification.service';
import { NotificationRouter } from './notification-router.service';

@Controller()
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(
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

    try {
      const notification = this.notificationRouter.resolve(event);
      if (!notification) {
        channel.ack(originalMessage);
        return;
      }

      await this.notificationService.process(notification);
      channel.ack(originalMessage);
    } catch (error) {
      if (error instanceof NonRetryableNotificationError) {
        this.logger.warn(`Non-retryable notification error: ${error.message}`);
        channel.ack(originalMessage);
        return;
      }

      if (error instanceof RetryableNotificationError) {
        this.logger.warn(`Retryable notification error: ${error.message}`);
        channel.nack(originalMessage, false, true);
        return;
      }

      this.logger.error(`Unexpected notification error: ${error instanceof Error ? error.message : 'unknown'}`);
      channel.nack(originalMessage, false, true);
    }
  }
}
