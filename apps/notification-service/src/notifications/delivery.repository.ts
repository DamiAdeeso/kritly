import { Injectable } from '@nestjs/common';
import { NotificationSendEvent } from '@kritly/common';
import { DeliveryStatus, NotificationChannel, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeliveryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByIdempotencyKey(idempotencyKey: string) {
    return this.prisma.notificationDelivery.findUnique({
      where: { idempotencyKey },
    });
  }

  createPending(event: NotificationSendEvent) {
    return this.prisma.notificationDelivery.create({
      data: {
        templateKey: event.templateKey,
        channel: event.channel as NotificationChannel,
        recipient: event.recipient,
        status: DeliveryStatus.pending,
        payload: event.data as Prisma.InputJsonValue,
        idempotencyKey: event.idempotencyKey,
        correlationId: event.correlationId,
        source: event.source,
      },
    });
  }

  markSent(id: string, payload: Prisma.InputJsonValue) {
    return this.prisma.notificationDelivery.update({
      where: { id },
      data: {
        status: DeliveryStatus.sent,
        payload,
        sentAt: new Date(),
        error: null,
      },
    });
  }

  markFailed(id: string, error: string) {
    return this.prisma.notificationDelivery.update({
      where: { id },
      data: {
        status: DeliveryStatus.failed,
        error,
      },
    });
  }

  markSkipped(idempotencyKey: string) {
    return this.prisma.notificationDelivery.create({
      data: {
        templateKey: 'duplicate',
        channel: NotificationChannel.email,
        recipient: 'skipped',
        status: DeliveryStatus.skipped,
        payload: {},
        idempotencyKey: `${idempotencyKey}:skipped:${Date.now()}`,
      },
    });
  }
}
