import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { hashSubject } from '@kritly/common';
import { EmailDeliveryProvider } from './email-provider.interface';
import { DeliveryResult, RenderedNotification } from './notification-channel.interface';

@Injectable()
export class SesEmailProvider implements EmailDeliveryProvider {
  readonly name = 'ses' as const;
  private client: SESClient | null = null;

  constructor(
    private readonly configService: ConfigService,
    @InjectPinoLogger(SesEmailProvider.name) private readonly logger: PinoLogger,
  ) {}

  private getClient(): SESClient | null {
    if (this.client) {
      return this.client;
    }

    const region = this.configService.get<string>('email.ses.region') ?? 'us-east-1';
    const accessKeyId = this.configService.get<string>('email.ses.accessKeyId');
    const secretAccessKey = this.configService.get<string>('email.ses.secretAccessKey');

    this.client = new SESClient({
      region,
      ...(accessKeyId && secretAccessKey
        ? { credentials: { accessKeyId, secretAccessKey } }
        : {}),
    });

    return this.client;
  }

  async send(rendered: RenderedNotification, from: string): Promise<DeliveryResult> {
    const client = this.getClient();
    if (!client) {
      return { success: false, error: 'SES client is not configured' };
    }

    const textBody = rendered.bodyText ?? rendered.bodyHtml;
    const htmlBody = rendered.bodyHtml ?? rendered.bodyText;

    if (!textBody && !htmlBody) {
      return { success: false, error: 'Email body is required for SES delivery' };
    }

    try {
      const response = await client.send(
        new SendEmailCommand({
          Source: from,
          Destination: {
            ToAddresses: [rendered.to],
          },
          Message: {
            Subject: {
              Charset: 'UTF-8',
              Data: rendered.subject ?? 'Notification',
            },
            Body: {
              ...(textBody
                ? {
                    Text: {
                      Charset: 'UTF-8',
                      Data: textBody,
                    },
                  }
                : {}),
              ...(htmlBody
                ? {
                    Html: {
                      Charset: 'UTF-8',
                      Data: htmlBody,
                    },
                  }
                : {}),
            },
          },
        }),
      );

      this.logger.info(
        {
          provider: this.name,
          recipientHash: hashSubject(rendered.to),
          providerMessageId: response.MessageId ?? null,
        },
        'email sent',
      );

      return {
        success: true,
        providerMessageId: response.MessageId,
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
