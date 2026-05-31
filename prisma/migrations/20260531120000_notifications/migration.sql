-- CreateEnum
CREATE TYPE "public"."NotificationChannel" AS ENUM ('email', 'sms', 'push');

-- CreateEnum
CREATE TYPE "public"."DeliveryStatus" AS ENUM ('pending', 'sent', 'failed', 'skipped');

-- CreateTable
CREATE TABLE "public"."notification_templates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "channel" "public"."NotificationChannel" NOT NULL,
    "subject" TEXT,
    "bodyText" TEXT,
    "bodyHtml" TEXT,
    "fieldSchema" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notification_deliveries" (
    "id" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "channel" "public"."NotificationChannel" NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" "public"."DeliveryStatus" NOT NULL DEFAULT 'pending',
    "payload" JSONB NOT NULL,
    "error" TEXT,
    "idempotencyKey" TEXT,
    "correlationId" TEXT,
    "source" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_key_channel_key" ON "public"."notification_templates"("key", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "notification_deliveries_idempotencyKey_key" ON "public"."notification_deliveries"("idempotencyKey");

-- CreateIndex
CREATE INDEX "notification_deliveries_status_createdAt_idx" ON "public"."notification_deliveries"("status", "createdAt");
