/*
  Warnings:

  - The values [PENDING,SENT_TO_KDS] on the enum `OrderItemStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [PENDING_CONFIRMATION,PREPARING,READY_FOR_PICKUP,SERVED,BILL_REQUESTED_LC,BILLED,PARTIALLY_PAID] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `readyForPickupAt` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `servedAt` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `customerServedAt` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `unitPrice` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `qrCodeValue` on the `Table` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Table` table. All the data in the column will be lost.
  - You are about to drop the column `tableNumber` on the `Table` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[businessId,identifier]` on the table `Table` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `priceAtPurchase` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Made the column `name_es` on table `Reward` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `identifier` to the `Table` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('DINE_IN', 'TAKE_AWAY', 'DELIVERY');

-- CreateEnum
CREATE TYPE "TableNotificationType" AS ENUM ('CALL_WAITER', 'REQUEST_BILL');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'SEATED', 'COMPLETED', 'NO_SHOW');

-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE 'POINTS_EARNED_ORDER_LC';

-- AlterEnum
BEGIN;
CREATE TYPE "OrderItemStatus_new" AS ENUM ('PENDING_KDS', 'PREPARING', 'READY', 'SERVED', 'CANCELLED', 'CANCELLATION_REQUESTED');
ALTER TABLE "OrderItem" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "OrderItem" ALTER COLUMN "status" TYPE "OrderItemStatus_new" USING ("status"::text::"OrderItemStatus_new");
ALTER TYPE "OrderItemStatus" RENAME TO "OrderItemStatus_old";
ALTER TYPE "OrderItemStatus_new" RENAME TO "OrderItemStatus";
DROP TYPE "OrderItemStatus_old";
ALTER TABLE "OrderItem" ALTER COLUMN "status" SET DEFAULT 'PENDING_KDS';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('RECEIVED', 'IN_PROGRESS', 'PARTIALLY_READY', 'ALL_ITEMS_READY', 'COMPLETED', 'PENDING_PAYMENT', 'PAID', 'CANCELLED', 'PAYMENT_FAILED');
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'RECEIVED';
COMMIT;

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_menuItemId_fkey";

-- DropIndex
DROP INDEX "Table_businessId_tableNumber_key";

-- DropIndex
DROP INDEX "Table_qrCodeValue_idx";

-- DropIndex
DROP INDEX "Table_qrCodeValue_key";

-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "stockQuantity" INTEGER,
ADD COLUMN     "trackInventory" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "readyForPickupAt",
DROP COLUMN "servedAt",
ADD COLUMN     "amountToPayWith" TEXT,
ADD COLUMN     "appliedLcoRewardDiscountAmount" DOUBLE PRECISION,
ADD COLUMN     "appliedLcoRewardId" TEXT,
ADD COLUMN     "appliedLcoTierBenefitDiscountAmount" DOUBLE PRECISION,
ADD COLUMN     "deliveryAddressJson" TEXT,
ADD COLUMN     "deliveryFee" DOUBLE PRECISION,
ADD COLUMN     "estimatedDeliveryTime" TIMESTAMP(3),
ADD COLUMN     "orderType" "OrderType" NOT NULL DEFAULT 'DINE_IN',
ADD COLUMN     "paymentIntentId" TEXT,
ADD COLUMN     "paymentMethodPreference" TEXT,
ADD COLUMN     "paymentProvider" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "customerServedAt",
DROP COLUMN "unitPrice",
ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "itemDescriptionSnapshot" TEXT,
ADD COLUMN     "itemNameSnapshot" TEXT,
ADD COLUMN     "priceAtPurchase" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "servedAt" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'PENDING_KDS',
ALTER COLUMN "menuItemId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "OrderItemModifierOption" ADD COLUMN     "optionNameSnapshot" TEXT,
ADD COLUMN     "optionPriceAdjustmentSnapshot" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Reward" ALTER COLUMN "name_es" SET NOT NULL;

-- AlterTable
ALTER TABLE "Table" DROP COLUMN "qrCodeValue",
DROP COLUMN "status",
DROP COLUMN "tableNumber",
ADD COLUMN     "identifier" TEXT NOT NULL;

-- DropEnum
DROP TYPE "TableStatus";

-- CreateTable
CREATE TABLE "TableNotification" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "type" "TableNotificationType" NOT NULL,
    "message" TEXT,
    "paymentPreference" TEXT,
    "payAmountInput" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedByUserId" TEXT,

    CONSTRAINT "TableNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT,
    "tableId" TEXT,
    "guestName" TEXT NOT NULL,
    "guestPhone" TEXT,
    "guestEmail" TEXT,
    "dateTime" TIMESTAMP(3) NOT NULL,
    "partySize" INTEGER NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "confirmationToken" TEXT,
    "checkInTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TableNotification_businessId_tableId_createdAt_idx" ON "TableNotification"("businessId", "tableId", "createdAt");

-- CreateIndex
CREATE INDEX "TableNotification_isResolved_idx" ON "TableNotification"("isResolved");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_confirmationToken_key" ON "Reservation"("confirmationToken");

-- CreateIndex
CREATE INDEX "Reservation_businessId_dateTime_idx" ON "Reservation"("businessId", "dateTime");

-- CreateIndex
CREATE INDEX "Reservation_businessId_customerId_idx" ON "Reservation"("businessId", "customerId");

-- CreateIndex
CREATE INDEX "Reservation_businessId_guestPhone_idx" ON "Reservation"("businessId", "guestPhone");

-- CreateIndex
CREATE INDEX "Reservation_businessId_guestEmail_idx" ON "Reservation"("businessId", "guestEmail");

-- CreateIndex
CREATE INDEX "Reservation_confirmationToken_idx" ON "Reservation"("confirmationToken");

-- CreateIndex
CREATE INDEX "Order_orderType_idx" ON "Order"("orderType");

-- CreateIndex
CREATE INDEX "OrderItem_kdsDestination_idx" ON "OrderItem"("kdsDestination");

-- CreateIndex
CREATE UNIQUE INDEX "Table_businessId_identifier_key" ON "Table"("businessId", "identifier");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_appliedLcoRewardId_fkey" FOREIGN KEY ("appliedLcoRewardId") REFERENCES "Reward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableNotification" ADD CONSTRAINT "TableNotification_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableNotification" ADD CONSTRAINT "TableNotification_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableNotification" ADD CONSTRAINT "TableNotification_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE SET NULL ON UPDATE CASCADE;
