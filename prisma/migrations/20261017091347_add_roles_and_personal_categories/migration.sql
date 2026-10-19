-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- DropIndex
DROP INDEX "Category_name_key";

-- AlterTable
ALTER TABLE "Category"
ADD COLUMN "userId" TEXT;

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "role" "Role" NOT NULL DEFAULT 'USER';

-- CreateIndex
CREATE INDEX "Category_userId_idx"
ON "Category"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_userId_name_key"
ON "Category"("userId", "name");

-- CreateIndex
-- Prevent duplicate names among global categories
CREATE UNIQUE INDEX "Category_global_name_key"
ON "Category"("name")
WHERE "userId" IS NULL;

-- AddForeignKey
ALTER TABLE "Category"
ADD CONSTRAINT "Category_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;