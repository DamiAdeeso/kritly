import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { INTEGRATION_EVENT_PATTERN, EVENT_BUS } from './event-bus.constants';
import {
  EVENT_PUBLISHER_OPTIONS,
  EventPublisherOptions,
} from './event-publisher.constants';
import { IntegrationEvent, PublishEventOptions } from './integration-event.interface';
import { buildIntegrationEventLogContext } from '../logging/integration-event-log.util';

@Injectable()
export class EventPublisher implements OnModuleInit {
  constructor(
    @Inject(EVENT_BUS) private readonly client: ClientProxy,
    @Inject(EVENT_PUBLISHER_OPTIONS) private readonly options: EventPublisherOptions,
    @InjectPinoLogger(EventPublisher.name) private readonly logger: PinoLogger,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.client.connect();
      this.logger.info({ source: this.options.source }, 'connected to event bus');
    } catch (error) {
      this.logger.error(
        {
          source: this.options.source,
          err: error instanceof Error ? error.message : 'unknown error',
        },
        'failed to connect to event bus',
      );
    }
  }

  publish<TPayload extends Record<string, unknown>>(
    type: string,
    payload: TPayload,
    options: PublishEventOptions = {},
  ): void {
    const event: IntegrationEvent<TPayload> = {
      type,
      source: this.options.source,
      payload,
      idempotencyKey: options.idempotencyKey,
      correlationId: options.correlationId,
      occurredAt: new Date().toISOString(),
    };

    this.logger.info(
      buildIntegrationEventLogContext(type, this.options.source, payload, options),
      'integration event published',
    );

    this.client.emit(INTEGRATION_EVENT_PATTERN, event);
  }
}
