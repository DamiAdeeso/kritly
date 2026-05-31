import { Injectable, Logger } from '@nestjs/common';
import {
  DOMAIN_EVENTS,
  IntegrationEvent,
  NOTIFICATION_TEMPLATE_KEYS,
  NotificationSendEvent,
  UserRegisteredPayload,
} from '@kritly/common';

interface NotificationRoute<TPayload> {
  channel: NotificationSendEvent['channel'];
  templateKey: string;
  recipient: (payload: TPayload) => string;
  data: (payload: TPayload) => Record<string, string>;
}

@Injectable()
export class NotificationRouter {
  private readonly logger = new Logger(NotificationRouter.name);

  private readonly userRegisteredRoute: NotificationRoute<UserRegisteredPayload> = {
    channel: 'email',
    templateKey: NOTIFICATION_TEMPLATE_KEYS.AUTH_WELCOME,
    recipient: (payload) => payload.email,
    data: (payload) => ({
      firstName: payload.firstName,
      email: payload.email,
    }),
  };

  resolve(event: IntegrationEvent): NotificationSendEvent | null {
    switch (event.type) {
      case DOMAIN_EVENTS.USER_REGISTERED:
        return this.toSendEvent(
          event,
          this.userRegisteredRoute,
          event.payload as unknown as UserRegisteredPayload,
        );
      default:
        this.logger.debug(`No notification route configured for event type: ${event.type}`);
        return null;
    }
  }

  private toSendEvent<TPayload>(
    event: IntegrationEvent,
    route: NotificationRoute<TPayload>,
    payload: TPayload,
  ): NotificationSendEvent {
    return {
      templateKey: route.templateKey,
      channel: route.channel,
      recipient: route.recipient(payload),
      data: route.data(payload),
      idempotencyKey: event.idempotencyKey,
      correlationId: event.correlationId,
      source: event.source,
      createdAt: event.occurredAt,
    };
  }
}
