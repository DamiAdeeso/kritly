import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import { EmailDeliveryProvider } from './email-provider.interface';
import { DeliveryResult, RenderedNotification } from './notification-channel.interface';

@Injectable()
export class SmtpEmailProvider implements EmailDeliveryProvider {
  readonly name = 'smtp' as const;
  private readonly logger = new Logger(SmtpEmailProvider.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  private getTransporter(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('email.smtp.host'),
        port: this.configService.get<number>('email.smtp.port'),
        secure: this.configService.get<boolean>('email.smtp.secure') ?? false,
        auth:
          this.configService.get<string>('email.smtp.user') &&
          this.configService.get<string>('email.smtp.pass')
            ? {
                user: this.configService.get<string>('email.smtp.user'),
                pass: this.configService.get<string>('email.smtp.pass'),
              }
            : undefined,
      });
    }

    return this.transporter;
  }

  async send(rendered: RenderedNotification, from: string): Promise<DeliveryResult> {
    try {
      const info = await this.getTransporter().sendMail({
        from,
        to: rendered.to,
        subject: rendered.subject,
        text: rendered.bodyText,
        html: rendered.bodyHtml ?? rendered.bodyText,
      });

      return {
        success: true,
        providerMessageId: info.messageId,
      };
    } catch (error) {
      this.logger.warn(`SMTP send failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'unknown error',
      };
    }
  }
}
