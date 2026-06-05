import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  private readonly logger = new Logger(MailtrapEmailProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async send(rendered: RenderedNotification, from: string): Promise<DeliveryResult> {
    const apiToken = this.configService.get<string>('email.mailtrap.apiToken');
    if (!apiToken) {
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
        this.logger.warn(`Mailtrap send failed: ${message}`);
        return { success: false, error: message };
      }

      return {
        success: true,
        providerMessageId: body.message_ids?.[0],
      };
    } catch (error) {
      this.logger.warn(
        `Mailtrap send failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : 'unknown error',
      };
    }
  }
}
