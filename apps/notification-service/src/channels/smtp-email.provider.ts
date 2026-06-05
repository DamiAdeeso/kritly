import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { hashSubject } from '@kritly/common';
import { EmailDeliveryProvider } from './email-provider.interface';
import { DeliveryResult, RenderedNotification } from './notification-channel.interface';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class SmtpEmailProvider implements EmailDeliveryProvider {
  readonly name = 'smtp' as const;
  private transporter: Transporter | null = null;

  constructor(
    private readonly configService: ConfigService,
    @InjectPinoLogger(SmtpEmailProvider.name) private readonly logger: PinoLogger,
  ) {}

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

      this.logger.info(
        {
          provider: this.name,
          recipientHash: hashSubject(rendered.to),
          providerMessageId: info.messageId ?? null,
        },
        'email sent',
      );

      return {
        success: true,
        providerMessageId: info.messageId,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(
        {
          provider: this.name,
          recipientHash: hashSubject(rendered.to),
          error: message,
        },
        'email send failed',
      );
      return {
        success: false,
        error: message,
      };
    }
  }
}
