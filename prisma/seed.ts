import { PrismaClient } from '@prisma/client';
import { notificationTemplates } from './email-templates';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  for (const template of notificationTemplates) {
    await prisma.notificationTemplate.upsert({
      where: {
        key_channel: {
          key: template.key,
          channel: template.channel,
        },
      },
      create: {
        key: template.key,
        channel: template.channel,
        subject: template.subject,
        bodyText: template.bodyText,
        bodyHtml: template.bodyHtml,
        fieldSchema: template.fieldSchema,
      },
      update: {
        subject: template.subject,
        bodyText: template.bodyText,
        bodyHtml: template.bodyHtml,
        fieldSchema: template.fieldSchema,
        isActive: true,
        version: { increment: 1 },
      },
    });
  }

  console.log(`Seeded ${notificationTemplates.length} notification templates`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
