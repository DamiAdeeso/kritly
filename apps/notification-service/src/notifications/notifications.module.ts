import { Module } from '@nestjs/common';
import { ChannelsModule } from '../channels/channels.module';
import { DeliveryRepository } from './delivery.repository';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

import { NotificationRouter } from './notification-router.service';

@Module({
  imports: [ChannelsModule],
  controllers: [NotificationController],
  providers: [NotificationService, DeliveryRepository, NotificationRouter],
  exports: [NotificationService],
})
export class NotificationsModule {}
