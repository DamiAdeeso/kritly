import { Module } from '@nestjs/common';
import { ChannelRegistry } from './channel.registry';
import { EmailSmtpChannel } from './email-smtp.channel';

@Module({
  providers: [EmailSmtpChannel, ChannelRegistry],
  exports: [ChannelRegistry],
})
export class ChannelsModule {}
