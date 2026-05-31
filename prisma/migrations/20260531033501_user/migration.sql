-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");
