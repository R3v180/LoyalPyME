-- CreateEnum
CREATE TYPE "TableStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'PENDING_PAYMENT_TABLE', 'NEEDS_CLEANING', 'RESERVED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "isBillRequested" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paidByUserId" TEXT,
ADD COLUMN     "paymentMethodUsed" TEXT;

-- AlterTable
ALTER TABLE "Table" ADD COLUMN     "status" "TableStatus" NOT NULL DEFAULT 'AVAILABLE';

-- CreateIndex
CREATE INDEX "Order_paidByUserId_idx" ON "Order"("paidByUserId");

-- CreateIndex
CREATE INDEX "Table_businessId_status_idx" ON "Table"("businessId", "status");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_paidByUserId_fkey" FOREIGN KEY ("paidByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
