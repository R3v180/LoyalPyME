/*
  Warnings:

  - You are about to drop the `Business` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "SuperAdminActionType" AS ENUM ('BUSINESS_STATUS_TOGGLED', 'MODULE_LOYALTY_TOGGLED', 'MODULE_CAMARERO_TOGGLED', 'SUBSCRIPTION_PRICE_UPDATED', 'MANUAL_PAYMENT_RECORDED', 'IMPERSONATION_STARTED', 'IMPERSONATION_ENDED');

-- DropForeignKey
ALTER TABLE "ActivityLog" DROP CONSTRAINT "ActivityLog_businessId_fkey";

-- DropForeignKey
ALTER TABLE "GrantedReward" DROP CONSTRAINT "GrantedReward_businessId_fkey";

-- DropForeignKey
ALTER TABLE "MenuCategory" DROP CONSTRAINT "MenuCategory_businessId_fkey";

-- DropForeignKey
ALTER TABLE "MenuItem" DROP CONSTRAINT "MenuItem_businessId_fkey";

-- DropForeignKey
ALTER TABLE "ModifierGroup" DROP CONSTRAINT "ModifierGroup_businessId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_businessId_fkey";

-- DropForeignKey
ALTER TABLE "QrCode" DROP CONSTRAINT "QrCode_businessId_fkey";

-- DropForeignKey
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_businessId_fkey";

-- DropForeignKey
ALTER TABLE "Reward" DROP CONSTRAINT "Reward_businessId_fkey";

-- DropForeignKey
ALTER TABLE "StaffPin" DROP CONSTRAINT "StaffPin_businessId_fkey";

-- DropForeignKey
ALTER TABLE "Table" DROP CONSTRAINT "Table_businessId_fkey";

-- DropForeignKey
ALTER TABLE "TableNotification" DROP CONSTRAINT "TableNotification_businessId_fkey";

-- DropForeignKey
ALTER TABLE "Tier" DROP CONSTRAINT "Tier_businessId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_businessId_fkey";

-- DropTable
DROP TABLE "Business";

-- CreateTable
CREATE TABLE "businesses" (
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
    "monthlyPrice" DECIMAL(10,2) DEFAULT 0.00,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_payments" (
    "id" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amountPaid" DECIMAL(10,2) NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "paymentMethod" TEXT,
    "notes" TEXT,
    "businessId" TEXT NOT NULL,
    "recordedByAdminId" TEXT NOT NULL,

    CONSTRAINT "business_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "superadmin_activity_logs" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionType" "SuperAdminActionType" NOT NULL,
    "details" JSONB,
    "adminUserId" TEXT NOT NULL,
    "targetBusinessId" TEXT,

    CONSTRAINT "superadmin_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "businesses_slug_key" ON "businesses"("slug");

-- CreateIndex
CREATE INDEX "business_payments_businessId_idx" ON "business_payments"("businessId");

-- CreateIndex
CREATE INDEX "business_payments_recordedByAdminId_idx" ON "business_payments"("recordedByAdminId");

-- CreateIndex
CREATE UNIQUE INDEX "business_payments_businessId_year_month_key" ON "business_payments"("businessId", "year", "month");

-- CreateIndex
CREATE INDEX "superadmin_activity_logs_adminUserId_idx" ON "superadmin_activity_logs"("adminUserId");

-- CreateIndex
CREATE INDEX "superadmin_activity_logs_targetBusinessId_idx" ON "superadmin_activity_logs"("targetBusinessId");

-- CreateIndex
CREATE INDEX "superadmin_activity_logs_actionType_idx" ON "superadmin_activity_logs"("actionType");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_payments" ADD CONSTRAINT "business_payments_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_payments" ADD CONSTRAINT "business_payments_recordedByAdminId_fkey" FOREIGN KEY ("recordedByAdminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "superadmin_activity_logs" ADD CONSTRAINT "superadmin_activity_logs_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "superadmin_activity_logs" ADD CONSTRAINT "superadmin_activity_logs_targetBusinessId_fkey" FOREIGN KEY ("targetBusinessId") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrCode" ADD CONSTRAINT "QrCode_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tier" ADD CONSTRAINT "Tier_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantedReward" ADD CONSTRAINT "GrantedReward_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuCategory" ADD CONSTRAINT "MenuCategory_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModifierGroup" ADD CONSTRAINT "ModifierGroup_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffPin" ADD CONSTRAINT "StaffPin_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableNotification" ADD CONSTRAINT "TableNotification_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
