import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { INTEGRATION_EVENT_PATTERN, EVENT_BUS } from './event-bus.constants';
import {
  EVENT_PUBLISHER_OPTIONS,
  EventPublisherOptions,
} from './event-publisher.constants';
import { IntegrationEvent, PublishEventOptions } from './integration-event.interface';

@Injectable()
export class EventPublisher {
  private readonly logger = new Logger(EventPublisher.name);

  constructor(
    @Inject(EVENT_BUS) private readonly client: ClientProxy,
    @Inject(EVENT_PUBLISHER_OPTIONS) private readonly options: EventPublisherOptions,
  ) {}

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

    this.client.emit(INTEGRATION_EVENT_PATTERN, event);
    this.logger.debug(`Published integration event ${type} from ${this.options.source}`);
  }
}
