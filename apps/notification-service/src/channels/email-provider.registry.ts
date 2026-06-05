import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { EmailProviderName } from '../config/email.constants';
import { EmailDeliveryProvider } from './email-provider.interface';
import { MailtrapEmailProvider } from './mailtrap-email.provider';
import { SesEmailProvider } from './ses-email.provider';
import { SmtpEmailProvider } from './smtp-email.provider';

@Injectable()
export class EmailProviderRegistry implements OnModuleInit {
  private activeProvider!: EmailDeliveryProvider;

  constructor(
    private readonly configService: ConfigService,
    private readonly smtpEmailProvider: SmtpEmailProvider,
    private readonly mailtrapEmailProvider: MailtrapEmailProvider,
    private readonly sesEmailProvider: SesEmailProvider,
    @InjectPinoLogger(EmailProviderRegistry.name) private readonly logger: PinoLogger,
  ) {}

  onModuleInit(): void {
    const providerName = this.configService.get<EmailProviderName>('email.provider') ?? 'smtp';
    this.activeProvider = this.resolveProvider(providerName);
    this.logger.info({ provider: this.activeProvider.name }, 'email delivery provider ready');
  }

  getProvider(): EmailDeliveryProvider {
    return this.activeProvider;
  }

  private resolveProvider(name: EmailProviderName): EmailDeliveryProvider {
    switch (name) {
      case 'mailtrap':
        return this.mailtrapEmailProvider;
      case 'ses':
        return this.sesEmailProvider;
      case 'smtp':
      default:
        return this.smtpEmailProvider;
    }
  }
}
