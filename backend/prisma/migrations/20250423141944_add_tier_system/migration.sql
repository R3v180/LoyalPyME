-- CreateEnum
CREATE TYPE "TierCalculationBasis" AS ENUM ('SPEND', 'VISITS', 'POINTS_EARNED');

-- CreateEnum
CREATE TYPE "TierDowngradePolicy" AS ENUM ('NEVER', 'PERIODIC_REVIEW', 'AFTER_INACTIVITY');

-- CreateEnum
CREATE TYPE "BenefitType" AS ENUM ('POINTS_MULTIPLIER', 'EXCLUSIVE_REWARD_ACCESS', 'CUSTOM_BENEFIT');

-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "inactivityPeriodMonths" INTEGER,
ADD COLUMN     "tierCalculationBasis" "TierCalculationBasis",
ADD COLUMN     "tierCalculationPeriodMonths" INTEGER,
ADD COLUMN     "tierDowngradePolicy" "TierDowngradePolicy" DEFAULT 'NEVER',
ADD COLUMN     "tierSystemEnabled" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "qr_codes" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "currentTierId" TEXT,
ADD COLUMN     "lastActivityAt" TIMESTAMP(3),
ADD COLUMN     "tierAchievedAt" TIMESTAMP(3),
ADD COLUMN     "totalPointsEarned" INTEGER DEFAULT 0,
ADD COLUMN     "totalSpend" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "totalVisits" INTEGER DEFAULT 0;

-- CreateTable
CREATE TABLE "Tier" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "minValue" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "benefitsDescription" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TierBenefit" (
    "id" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "type" "BenefitType" NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TierBenefit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tier_businessId_level_key" ON "Tier"("businessId", "level");

-- CreateIndex
CREATE UNIQUE INDEX "Tier_businessId_name_key" ON "Tier"("businessId", "name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_currentTierId_fkey" FOREIGN KEY ("currentTierId") REFERENCES "Tier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tier" ADD CONSTRAINT "Tier_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierBenefit" ADD CONSTRAINT "TierBenefit_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "Tier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
