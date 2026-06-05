import { RmqContext } from '@nestjs/microservices';
import { DOMAIN_EVENTS } from '@kritly/common';
import {
  NonRetryableNotificationError,
  NotificationService,
  RetryableNotificationError,
} from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationRouter } from './notification-router.service';

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
};

describe('NotificationController', () => {
  let controller: NotificationController;
  let notificationRouter: jest.Mocked<Pick<NotificationRouter, 'resolve'>>;
  let notificationService: jest.Mocked<Pick<NotificationService, 'process'>>;
  let ack: jest.Mock;
  let nack: jest.Mock;
  let context: RmqContext;

  const integrationEvent = {
    type: DOMAIN_EVENTS.USER_REGISTERED,
    payload: {
      userId: 'user-1',
      email: 'user@example.com',
      displayName: 'Jane',
    },
    source: 'auth-service',
    correlationId: 'corr-1',
    idempotencyKey: 'register:user-1',
    occurredAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    ack = jest.fn();
    nack = jest.fn();
    notificationRouter = {
      resolve: jest.fn(),
    };
    notificationService = {
      process: jest.fn(),
    };

    context = {
      getChannelRef: () => ({ ack, nack }),
      getMessage: () => ({ content: Buffer.from('event') }),
    } as unknown as RmqContext;

    controller = new NotificationController(
      mockLogger as never,
      notificationRouter as unknown as NotificationRouter,
      notificationService as unknown as NotificationService,
    );
  });

  it('acks messages that do not map to a notification route', async () => {
    notificationRouter.resolve.mockReturnValue(null);

    await controller.handleIntegrationEvent(integrationEvent, context);

    expect(ack).toHaveBeenCalled();
    expect(notificationService.process).not.toHaveBeenCalled();
  });

  it('acks messages after successful delivery', async () => {
    notificationRouter.resolve.mockReturnValue({
      templateKey: 'auth.welcome',
      channel: 'email',
      recipient: 'user@example.com',
      data: { displayName: 'Jane', email: 'user@example.com' },
      idempotencyKey: 'register:user-1',
      correlationId: 'corr-1',
      source: 'auth-service',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    notificationService.process.mockResolvedValue(undefined);

    await controller.handleIntegrationEvent(integrationEvent, context);

    expect(notificationService.process).toHaveBeenCalled();
    expect(ack).toHaveBeenCalled();
  });

  it('acks non-retryable delivery failures', async () => {
    notificationRouter.resolve.mockReturnValue({
      templateKey: 'auth.welcome',
      channel: 'email',
      recipient: 'user@example.com',
      data: { displayName: 'Jane', email: 'user@example.com' },
    } as never);
    notificationService.process.mockRejectedValue(
      new NonRetryableNotificationError('Template not found'),
    );

    await controller.handleIntegrationEvent(integrationEvent, context);

    expect(ack).toHaveBeenCalled();
    expect(nack).not.toHaveBeenCalled();
  });

  it('nacks retryable delivery failures for redelivery', async () => {
    notificationRouter.resolve.mockReturnValue({
      templateKey: 'auth.welcome',
      channel: 'email',
      recipient: 'user@example.com',
      data: { displayName: 'Jane', email: 'user@example.com' },
    } as never);
    notificationService.process.mockRejectedValue(new RetryableNotificationError('SMTP down'));

    await controller.handleIntegrationEvent(integrationEvent, context);

    expect(nack).toHaveBeenCalledWith({ content: Buffer.from('event') }, false, true);
    expect(ack).not.toHaveBeenCalled();
  });
});
