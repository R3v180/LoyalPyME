/*
  Warnings:

  - You are about to drop the `businesses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `granted_rewards` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `qr_codes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rewards` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityType" ADD VALUE 'TIER_UPGRADE';
ALTER TYPE "ActivityType" ADD VALUE 'TIER_DOWNGRADE';

-- AlterEnum
ALTER TYPE "QrCodeStatus" ADD VALUE 'CANCELLED';

-- DropForeignKey
ALTER TABLE "ActivityLog" DROP CONSTRAINT "ActivityLog_businessId_fkey";

-- DropForeignKey
ALTER TABLE "ActivityLog" DROP CONSTRAINT "ActivityLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "Tier" DROP CONSTRAINT "Tier_businessId_fkey";

-- DropForeignKey
ALTER TABLE "granted_rewards" DROP CONSTRAINT "granted_rewards_assignedById_fkey";

-- DropForeignKey
ALTER TABLE "granted_rewards" DROP CONSTRAINT "granted_rewards_businessId_fkey";

-- DropForeignKey
ALTER TABLE "granted_rewards" DROP CONSTRAINT "granted_rewards_rewardId_fkey";

-- DropForeignKey
ALTER TABLE "granted_rewards" DROP CONSTRAINT "granted_rewards_userId_fkey";

-- DropForeignKey
ALTER TABLE "qr_codes" DROP CONSTRAINT "qr_codes_businessId_fkey";

-- DropForeignKey
ALTER TABLE "qr_codes" DROP CONSTRAINT "qr_codes_userId_fkey";

-- DropForeignKey
ALTER TABLE "rewards" DROP CONSTRAINT "rewards_businessId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_businessId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_currentTierId_fkey";

-- DropIndex
DROP INDEX "ActivityLog_userId_createdAt_idx";

-- DropTable
DROP TABLE "businesses";

-- DropTable
DROP TABLE "granted_rewards";

-- DropTable
DROP TABLE "qr_codes";

-- DropTable
DROP TABLE "rewards";

-- DropTable
DROP TABLE "users";

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "brandingColorPrimary" TEXT DEFAULT '#007bff',
    "brandingColorSecondary" TEXT DEFAULT '#6c757d',
    "pointsPerEuro" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "qrCodeExpirationMinutes" INTEGER NOT NULL DEFAULT 30,
    "tierSystemEnabled" BOOLEAN NOT NULL DEFAULT false,
    "tierCalculationBasis" "TierCalculationBasis",
    "tierCalculationPeriodMonths" INTEGER DEFAULT 0,
    "tierDowngradePolicy" "TierDowngradePolicy" NOT NULL DEFAULT 'NEVER',
    "inactivityPeriodMonths" INTEGER DEFAULT 6,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isLoyaltyCoreActive" BOOLEAN NOT NULL DEFAULT false,
    "isCamareroActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "documentId" TEXT,
    "documentType" "DocumentType",
    "role" "UserRole" NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "totalSpend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalVisits" INTEGER NOT NULL DEFAULT 0,
    "tierAchievedAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3),
    "reset_password_token" TEXT,
    "reset_password_expires_at" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFavorite" BOOLEAN DEFAULT false,
    "adminNotes" TEXT,
    "businessId" TEXT,
    "currentTierId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL,
    "name_es" TEXT,
    "name_en" TEXT,
    "description_es" TEXT,
    "description_en" TEXT,
    "pointsCost" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QrCode" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "pointsEarned" INTEGER,
    "status" "QrCodeStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QrCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrantedReward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "assignedById" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "GrantedReward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Business_slug_key" ON "Business"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_documentId_key" ON "User"("documentId");

-- CreateIndex
CREATE INDEX "User_businessId_idx" ON "User"("businessId");

-- CreateIndex
CREATE INDEX "User_currentTierId_idx" ON "User"("currentTierId");

-- CreateIndex
CREATE INDEX "Reward_businessId_idx" ON "Reward"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "Reward_businessId_name_es_key" ON "Reward"("businessId", "name_es");

-- CreateIndex
CREATE UNIQUE INDEX "Reward_businessId_name_en_key" ON "Reward"("businessId", "name_en");

-- CreateIndex
CREATE UNIQUE INDEX "QrCode_token_key" ON "QrCode"("token");

-- CreateIndex
CREATE INDEX "QrCode_businessId_idx" ON "QrCode"("businessId");

-- CreateIndex
CREATE INDEX "QrCode_userId_idx" ON "QrCode"("userId");

-- CreateIndex
CREATE INDEX "GrantedReward_userId_idx" ON "GrantedReward"("userId");

-- CreateIndex
CREATE INDEX "GrantedReward_rewardId_idx" ON "GrantedReward"("rewardId");

-- CreateIndex
CREATE INDEX "GrantedReward_assignedById_idx" ON "GrantedReward"("assignedById");

-- CreateIndex
CREATE INDEX "GrantedReward_businessId_idx" ON "GrantedReward"("businessId");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_type_idx" ON "ActivityLog"("type");

-- CreateIndex
CREATE INDEX "ActivityLog_relatedRewardId_idx" ON "ActivityLog"("relatedRewardId");

-- CreateIndex
CREATE INDEX "ActivityLog_relatedQrId_idx" ON "ActivityLog"("relatedQrId");

-- CreateIndex
CREATE INDEX "ActivityLog_relatedGrantedRewardId_idx" ON "ActivityLog"("relatedGrantedRewardId");

-- CreateIndex
CREATE INDEX "Tier_businessId_idx" ON "Tier"("businessId");

-- CreateIndex
CREATE INDEX "TierBenefit_tierId_idx" ON "TierBenefit"("tierId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_currentTierId_fkey" FOREIGN KEY ("currentTierId") REFERENCES "Tier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrCode" ADD CONSTRAINT "QrCode_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrCode" ADD CONSTRAINT "QrCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tier" ADD CONSTRAINT "Tier_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_relatedRewardId_fkey" FOREIGN KEY ("relatedRewardId") REFERENCES "Reward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_relatedQrId_fkey" FOREIGN KEY ("relatedQrId") REFERENCES "QrCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_relatedGrantedRewardId_fkey" FOREIGN KEY ("relatedGrantedRewardId") REFERENCES "GrantedReward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantedReward" ADD CONSTRAINT "GrantedReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantedReward" ADD CONSTRAINT "GrantedReward_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantedReward" ADD CONSTRAINT "GrantedReward_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantedReward" ADD CONSTRAINT "GrantedReward_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
