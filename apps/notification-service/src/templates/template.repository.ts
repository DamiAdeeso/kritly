import { NotificationChannel, NotificationTemplate } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TemplateRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActive(key: string, channel: NotificationChannel): Promise<NotificationTemplate | null> {
    return this.prisma.notificationTemplate.findFirst({
      where: { key, channel, isActive: true },
    });
  }
}
