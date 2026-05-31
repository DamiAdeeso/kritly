import { Injectable, NotImplementedException } from '@nestjs/common';
import { NotificationChannel } from '@kritly/common';
import { EmailSmtpChannel } from './email-smtp.channel';
import { NotificationChannelAdapter } from './notification-channel.interface';

@Injectable()
export class ChannelRegistry {
  constructor(private readonly emailSmtpChannel: EmailSmtpChannel) {}

  get(channel: NotificationChannel): NotificationChannelAdapter {
    switch (channel) {
      case 'email':
        return this.emailSmtpChannel;
      case 'sms':
      case 'push':
        throw new NotImplementedException(`Channel "${channel}" is not implemented yet`);
      default:
        throw new NotImplementedException(`Unknown channel "${channel as string}"`);
    }
  }
}
