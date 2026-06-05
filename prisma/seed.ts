import { NotificationChannel, Prisma, PrismaClient } from '@prisma/client';
import { notificationTemplates } from './email-templates';

const prisma = new PrismaClient();

type TemplateSeed = {
  key: string;
  channel: NotificationChannel;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  fieldSchema: Prisma.InputJsonValue;
};

function stableJsonString(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJsonString(item)).join(',')}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableJsonString(record[key])}`).join(',')}}`;
}

function templateContentMatches(
  existing: {
    subject: string | null;
    bodyText: string | null;
    bodyHtml: string | null;
    fieldSchema: Prisma.JsonValue;
  },
  template: TemplateSeed,
): boolean {
  return (
    existing.subject === template.subject &&
    existing.bodyText === template.bodyText &&
    existing.bodyHtml === template.bodyHtml &&
    stableJsonString(existing.fieldSchema) === stableJsonString(template.fieldSchema)
  );
}

async function upsertNotificationTemplate(template: TemplateSeed): Promise<'created' | 'updated' | 'unchanged'> {
  const where = {
    key_channel: {
      key: template.key,
      channel: template.channel,
    },
  };

  const existing = await prisma.notificationTemplate.findUnique({ where });

  if (!existing) {
    await prisma.notificationTemplate.create({
      data: {
        key: template.key,
        channel: template.channel,
        subject: template.subject,
        bodyText: template.bodyText,
        bodyHtml: template.bodyHtml,
        fieldSchema: template.fieldSchema,
      },
    });
    return 'created';
  }

  if (templateContentMatches(existing, template)) {
    return 'unchanged';
  }

  await prisma.notificationTemplate.update({
    where,
    data: {
      subject: template.subject,
      bodyText: template.bodyText,
      bodyHtml: template.bodyHtml,
      fieldSchema: template.fieldSchema,
      isActive: true,
      version: { increment: 1 },
    },
  });
  return 'updated';
}

async function main(): Promise<void> {
  const summary = { created: 0, updated: 0, unchanged: 0 };

  for (const template of notificationTemplates) {
    const result = await upsertNotificationTemplate(template);
    summary[result] += 1;
  }

  console.log(
    `Seeded notification templates: ${summary.created} created, ${summary.updated} updated, ${summary.unchanged} unchanged`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
