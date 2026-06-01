-- Signup leaves names unset (NULL); profile update sets them explicitly.
ALTER TABLE "users" ALTER COLUMN "firstName" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "lastName" DROP DEFAULT;

UPDATE "users" SET "firstName" = NULL WHERE "firstName" = '';
UPDATE "users" SET "lastName" = NULL WHERE "lastName" = '';
