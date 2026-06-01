-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bio" TEXT;

ALTER TABLE "users" ALTER COLUMN "firstName" SET DEFAULT '';
ALTER TABLE "users" ALTER COLUMN "lastName" SET DEFAULT '';

UPDATE "users" SET "firstName" = '' WHERE "firstName" IS NULL;
UPDATE "users" SET "lastName" = '' WHERE "lastName" IS NULL;
