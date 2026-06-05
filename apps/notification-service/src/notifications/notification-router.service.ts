import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  DOMAIN_EVENTS,
  IntegrationEvent,
  NOTIFICATION_TEMPLATE_KEYS,
  NotificationSendEvent,
  UserRegisteredPayload,
  VerificationOtpRequestedPayload,
  hashSubject,
} from '@kritly/common';

interface NotificationRoute<TPayload> {
  channel: NotificationSendEvent['channel'];
  templateKey: string;
  recipient: (payload: TPayload) => string;
  data: (payload: TPayload) => Record<string, string>;
}

@Injectable()
export class NotificationRouter {
  constructor(@InjectPinoLogger(NotificationRouter.name) private readonly logger: PinoLogger) {}

  private readonly userRegisteredRoute: NotificationRoute<UserRegisteredPayload> = {
    channel: 'email',
    templateKey: NOTIFICATION_TEMPLATE_KEYS.AUTH_WELCOME,
    recipient: (payload) => payload.email,
    data: (payload) => ({
      displayName: payload.displayName,
      email: payload.email,
    }),
  };

  private readonly verificationOtpRoute: NotificationRoute<VerificationOtpRequestedPayload> = {
    channel: 'email',
    templateKey: NOTIFICATION_TEMPLATE_KEYS.VERIFICATION_OTP,
    recipient: (payload) => payload.recipient,
    data: (payload) => ({
      code: payload.code,
      expiresIn: payload.expiresIn,
      purposeLabel: payload.purposeLabel,
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
      case DOMAIN_EVENTS.VERIFICATION_OTP_REQUESTED:
        return this.toSendEvent(
          event,
          this.verificationOtpRoute,
          event.payload as unknown as VerificationOtpRequestedPayload,
        );
      default:
        this.logger.debug({ eventType: event.type }, 'no notification route configured');
        return null;
    }
  }

  private toSendEvent<TPayload>(
    event: IntegrationEvent,
    route: NotificationRoute<TPayload>,
    payload: TPayload,
  ): NotificationSendEvent {
    const notification = {
      templateKey: route.templateKey,
      channel: route.channel,
      recipient: route.recipient(payload),
      data: route.data(payload),
      idempotencyKey: event.idempotencyKey,
      correlationId: event.correlationId,
      source: event.source,
      createdAt: event.occurredAt,
    };

    this.logger.debug(
      {
        eventType: event.type,
        templateKey: notification.templateKey,
        channel: notification.channel,
        recipientHash: hashSubject(notification.recipient),
      },
      'notification route resolved',
    );

    return notification;
  }
}
