import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { hashSubject } from '@kritly/common';
import { EmailDeliveryProvider } from './email-provider.interface';
import { DeliveryResult, RenderedNotification } from './notification-channel.interface';
import { parseFromAddress } from './parse-from.util';

type MailtrapSendResponse = {
  success?: boolean;
  message_ids?: string[];
  errors?: string[];
};

@Injectable()
export class MailtrapEmailProvider implements EmailDeliveryProvider {
  readonly name = 'mailtrap' as const;

  constructor(
    private readonly configService: ConfigService,
    @InjectPinoLogger(MailtrapEmailProvider.name) private readonly logger: PinoLogger,
  ) {}

  async send(rendered: RenderedNotification, from: string): Promise<DeliveryResult> {
    const apiToken = this.configService.get<string>('email.mailtrap.apiToken');
    if (!apiToken) {
      this.logger.warn({ provider: this.name }, 'MAILTRAP_API_TOKEN is missing');
      return {
        success: false,
        error: 'MAILTRAP_API_TOKEN is required when EMAIL_PROVIDER=mailtrap',
      };
    }

    const apiUrl = this.configService.get<string>('email.mailtrap.apiUrl');
    const fromAddress = parseFromAddress(from);

    try {
      const response = await fetch(apiUrl!, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [{ email: rendered.to }],
          subject: rendered.subject,
          text: rendered.bodyText,
          html: rendered.bodyHtml ?? rendered.bodyText,
          category: 'transactional',
        }),
      });

      const body = (await response.json().catch(() => ({}))) as MailtrapSendResponse;

      if (!response.ok) {
        const message =
          body.errors?.join(', ') ||
          `Mailtrap API responded with status ${response.status}`;
        this.logger.warn(
          {
            provider: this.name,
            recipientHash: hashSubject(rendered.to),
            status: response.status,
            error: message,
          },
          'email send failed',
        );
        return { success: false, error: message };
      }

      this.logger.info(
        {
          provider: this.name,
          recipientHash: hashSubject(rendered.to),
          providerMessageId: body.message_ids?.[0] ?? null,
        },
        'email sent',
      );

      return {
        success: true,
        providerMessageId: body.message_ids?.[0],
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
