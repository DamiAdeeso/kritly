-- Add displayName and migrate from firstName/lastName
ALTER TABLE "users" ADD COLUMN "displayName" TEXT;

UPDATE "users"
SET "displayName" = NULLIF(TRIM(BOTH FROM CONCAT_WS(' ', "firstName", "lastName")), '')
WHERE "firstName" IS NOT NULL OR "lastName" IS NOT NULL;

ALTER TABLE "users" DROP COLUMN "firstName";
ALTER TABLE "users" DROP COLUMN "lastName";
