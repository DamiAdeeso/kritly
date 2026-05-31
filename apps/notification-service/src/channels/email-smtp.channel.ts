import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import {
  DeliveryResult,
  NotificationChannelAdapter,
  RenderedNotification,
} from './notification-channel.interface';

@Injectable()
export class EmailSmtpChannel implements NotificationChannelAdapter {
  readonly channel = 'email';
  private readonly logger = new Logger(EmailSmtpChannel.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  private getTransporter(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('smtp.host'),
        port: this.configService.get<number>('smtp.port'),
        secure: this.configService.get<boolean>('smtp.secure') ?? false,
        auth:
          this.configService.get<string>('smtp.user') && this.configService.get<string>('smtp.pass')
            ? {
                user: this.configService.get<string>('smtp.user'),
                pass: this.configService.get<string>('smtp.pass'),
              }
            : undefined,
      });
    }

    return this.transporter;
  }

  async send(rendered: RenderedNotification): Promise<DeliveryResult> {
    try {
      const info = await this.getTransporter().sendMail({
        from: this.configService.get<string>('smtp.from'),
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
