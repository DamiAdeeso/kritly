import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Handlebars from 'handlebars';
import { NotificationFieldSchema } from '@kritly/common';
import { NotificationTemplate } from '@prisma/client';

export interface RenderedTemplate {
  subject?: string;
  bodyText?: string;
  bodyHtml?: string;
}

@Injectable()
export class TemplateEngineService {
  constructor(private readonly configService: ConfigService) {}

  render(template: NotificationTemplate, data: Record<string, string>): RenderedTemplate {
    const fieldSchema = template.fieldSchema as NotificationFieldSchema;
    this.validateFields(fieldSchema, data);

    const context = {
      ...data,
      brandName: 'Kritly',
      tagline: 'Review. Connect. Share Stories.',
      websiteUrl: data.websiteUrl ?? 'https://kritly.com',
      appUrl: data.appUrl ?? this.configService.get<string>('notification.appUrl') ?? 'https://kritly.com',
      supportEmail:
        data.supportEmail ?? this.configService.get<string>('notification.supportEmail') ?? 'support@kritly.com',
    };

    return {
      subject: template.subject ? this.compile(template.subject)(context) : undefined,
      bodyText: template.bodyText ? this.compile(template.bodyText)(context) : undefined,
      bodyHtml: template.bodyHtml ? this.compile(template.bodyHtml)(context) : undefined,
    };
  }

  private validateFields(schema: NotificationFieldSchema, data: Record<string, string>): void {
    for (const field of schema.required ?? []) {
      if (!data[field]?.trim()) {
        throw new BadRequestException(`Missing required template field: ${field}`);
      }
    }
  }

  private compile(source: string): HandlebarsTemplateDelegate<Record<string, string>> {
    return Handlebars.compile(source, { noEscape: false });
  }
}
