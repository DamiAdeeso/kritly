import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { EVENT_BUS } from './event-bus.constants';
import {
  EVENT_PUBLISHER_OPTIONS,
  EventPublisherOptions,
} from './event-publisher.constants';
import { EventPublisher } from './event-publisher.service';

@Module({})
export class EventPublisherModule {
  static register(options: EventPublisherOptions): DynamicModule {
    return {
      module: EventPublisherModule,
      global: true,
      imports: [ConfigModule],
      providers: [
        {
          provide: EVENT_PUBLISHER_OPTIONS,
          useValue: options,
        },
        {
          provide: EVENT_BUS,
          inject: [ConfigService],
          useFactory: (configService: ConfigService) =>
            ClientProxyFactory.create({
              transport: Transport.RMQ,
              options: {
                urls: [configService.get<string>('RABBITMQ_URL') ?? 'amqp://kritly:kritly@localhost:5672'],
                queue:
                  configService.get<string>('RABBITMQ_NOTIFICATION_QUEUE') ?? 'notification-service.send',
                queueOptions: { durable: true },
              },
            }),
        },
        EventPublisher,
      ],
      exports: [EventPublisher],
    };
  }
}
