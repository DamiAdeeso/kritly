import {
  NonRetryableNotificationError,
  NotificationService,
  RetryableNotificationError,
} from './notification.service';
import { DeliveryRepository } from './delivery.repository';
import { TemplateCacheService } from '../templates/template-cache.service';
import { TemplateEngineService } from '../templates/template-engine.service';
import { ChannelRegistry } from '../channels/channel.registry';

describe('NotificationService', () => {
  let service: NotificationService;
  let deliveryRepository: jest.Mocked<
    Pick<DeliveryRepository, 'findByIdempotencyKey' | 'createPending' | 'markSent' | 'markFailed'>
  >;
  let templateCacheService: jest.Mocked<Pick<TemplateCacheService, 'getTemplate'>>;
  let templateEngineService: jest.Mocked<Pick<TemplateEngineService, 'render'>>;
  let channelRegistry: jest.Mocked<Pick<ChannelRegistry, 'get'>>;
  let channelSend: jest.Mock;

  const event = {
    templateKey: 'auth.welcome',
    channel: 'email' as const,
    recipient: 'user@example.com',
    data: { displayName: 'Jane', email: 'user@example.com' },
    idempotencyKey: 'register:user-1',
    correlationId: 'corr-1',
    source: 'auth-service',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    channelSend = jest.fn();
    deliveryRepository = {
      findByIdempotencyKey: jest.fn().mockResolvedValue(null),
      createPending: jest.fn().mockResolvedValue({ id: 'delivery-1' }),
      markSent: jest.fn().mockResolvedValue(undefined),
      markFailed: jest.fn().mockResolvedValue(undefined),
    };
    templateCacheService = {
      getTemplate: jest.fn().mockResolvedValue({
        id: 'template-1',
        key: 'auth.welcome',
        channel: 'email',
        subject: 'Welcome {{displayName}}',
        bodyText: 'Hi {{displayName}}',
        bodyHtml: null,
        fieldSchema: { required: ['displayName'] },
      }),
    };
    templateEngineService = {
      render: jest.fn().mockReturnValue({
        subject: 'Welcome Jane',
        bodyText: 'Hi Jane',
        bodyHtml: undefined,
      }),
    };
    channelRegistry = {
      get: jest.fn().mockReturnValue({ channel: 'email', send: channelSend }),
    };

    service = new NotificationService(
      deliveryRepository as unknown as DeliveryRepository,
      templateCacheService as unknown as TemplateCacheService,
      templateEngineService as unknown as TemplateEngineService,
      channelRegistry as unknown as ChannelRegistry,
    );
  });

  it('sends a notification and marks delivery as sent', async () => {
    channelSend.mockResolvedValue({ success: true, providerMessageId: 'msg-1' });

    await service.process(event);

    expect(deliveryRepository.createPending).toHaveBeenCalledWith(event);
    expect(channelSend).toHaveBeenCalledWith({
      to: 'user@example.com',
      subject: 'Welcome Jane',
      bodyText: 'Hi Jane',
      bodyHtml: undefined,
    });
    expect(deliveryRepository.markSent).toHaveBeenCalledWith(
      'delivery-1',
      expect.objectContaining({
        providerMessageId: 'msg-1',
      }),
    );
  });

  it('skips duplicate notifications that were already sent', async () => {
    deliveryRepository.findByIdempotencyKey.mockResolvedValue({
      id: 'delivery-existing',
      status: 'sent',
    } as never);

    await service.process(event);

    expect(deliveryRepository.createPending).not.toHaveBeenCalled();
    expect(channelSend).not.toHaveBeenCalled();
  });

  it('throws a non-retryable error when the template is missing', async () => {
    templateCacheService.getTemplate.mockResolvedValue(null);

    await expect(service.process(event)).rejects.toBeInstanceOf(NonRetryableNotificationError);
    expect(deliveryRepository.markFailed).toHaveBeenCalledWith(
      'delivery-1',
      expect.stringContaining('Template not found'),
    );
  });

  it('throws a retryable error when channel delivery fails', async () => {
    channelSend.mockResolvedValue({ success: false, error: 'SMTP down' });

    await expect(service.process(event)).rejects.toBeInstanceOf(RetryableNotificationError);
    expect(deliveryRepository.markFailed).toHaveBeenCalledWith('delivery-1', 'SMTP down');
  });
});
