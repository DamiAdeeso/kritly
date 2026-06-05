import { Module } from '@nestjs/common';
import { ChannelRegistry } from './channel.registry';
import { EmailChannel } from './email.channel';
import { EmailProviderRegistry } from './email-provider.registry';
import { MailtrapEmailProvider } from './mailtrap-email.provider';
import { SesEmailProvider } from './ses-email.provider';
import { SmtpEmailProvider } from './smtp-email.provider';

@Module({
  providers: [
    SmtpEmailProvider,
    MailtrapEmailProvider,
    SesEmailProvider,
    EmailProviderRegistry,
    EmailChannel,
    ChannelRegistry,
  ],
  exports: [ChannelRegistry],
})
export class ChannelsModule {}
