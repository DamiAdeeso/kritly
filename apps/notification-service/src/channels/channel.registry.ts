import { Injectable, NotImplementedException } from '@nestjs/common';
import { NotificationChannel } from '@kritly/common';
import { EmailChannel } from './email.channel';
import { NotificationChannelAdapter } from './notification-channel.interface';

@Injectable()
export class ChannelRegistry {
  constructor(private readonly emailChannel: EmailChannel) {}

  get(channel: NotificationChannel): NotificationChannelAdapter {
    switch (channel) {
      case 'email':
        return this.emailChannel;
      case 'sms':
      case 'push':
        throw new NotImplementedException(`Channel "${channel}" is not implemented yet`);
      default:
        throw new NotImplementedException(`Unknown channel "${channel as string}"`);
    }
  }
}
