import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailProviderRegistry } from './email-provider.registry';
import { NotificationChannelAdapter, RenderedNotification } from './notification-channel.interface';

@Injectable()
export class EmailChannel implements NotificationChannelAdapter {
  readonly channel = 'email';

  constructor(
    private readonly configService: ConfigService,
    private readonly emailProviderRegistry: EmailProviderRegistry,
  ) {}

  send(rendered: RenderedNotification) {
    const from = this.configService.get<string>('email.from') ?? 'Kritly <noreply@kritly.com>';
    return this.emailProviderRegistry.getProvider().send(rendered, from);
  }
}
