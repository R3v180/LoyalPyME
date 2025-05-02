/*
  Warnings:

  - A unique constraint covering the columns `[businessId,name]` on the table `rewards` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Tier" DROP CONSTRAINT "Tier_businessId_fkey";

-- DropForeignKey
ALTER TABLE "granted_rewards" DROP CONSTRAINT "granted_rewards_businessId_fkey";

-- DropForeignKey
ALTER TABLE "qr_codes" DROP CONSTRAINT "qr_codes_businessId_fkey";

-- DropForeignKey
ALTER TABLE "rewards" DROP CONSTRAINT "rewards_businessId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_businessId_fkey";

-- AlterTable
ALTER TABLE "rewards" ADD COLUMN     "imageUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "rewards_businessId_name_key" ON "rewards"("businessId", "name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tier" ADD CONSTRAINT "Tier_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "granted_rewards" ADD CONSTRAINT "granted_rewards_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
