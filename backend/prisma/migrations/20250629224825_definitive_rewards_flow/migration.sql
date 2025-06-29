/*
  Warnings:

  - The `status` column on the `GrantedReward` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[userId,rewardId,appliedToOrderId]` on the table `GrantedReward` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "GrantedRewardStatus" AS ENUM ('PENDING', 'AVAILABLE', 'APPLIED', 'EXPIRED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityType" ADD VALUE 'REWARD_ACQUIRED';
ALTER TYPE "ActivityType" ADD VALUE 'REWARD_APPLIED_TO_ORDER';

-- DropIndex
DROP INDEX "GrantedReward_userId_rewardId_key";

-- AlterTable
ALTER TABLE "GrantedReward" ADD COLUMN     "appliedToOrderId" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "GrantedRewardStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "GrantedReward_userId_rewardId_appliedToOrderId_key" ON "GrantedReward"("userId", "rewardId", "appliedToOrderId");

-- AddForeignKey
ALTER TABLE "GrantedReward" ADD CONSTRAINT "GrantedReward_appliedToOrderId_fkey" FOREIGN KEY ("appliedToOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
