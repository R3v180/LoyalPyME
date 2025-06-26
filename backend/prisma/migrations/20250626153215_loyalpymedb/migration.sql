-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'BUSINESS_ADMIN', 'CUSTOMER_FINAL', 'WAITER', 'KITCHEN_STAFF', 'BAR_STAFF');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('DNI', 'NIE', 'PASSPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "QrCodeStatus" AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TierCalculationBasis" AS ENUM ('SPEND', 'VISITS', 'POINTS_EARNED');

-- CreateEnum
CREATE TYPE "TierDowngradePolicy" AS ENUM ('NEVER', 'PERIODIC_REVIEW', 'AFTER_INACTIVITY');

-- CreateEnum
CREATE TYPE "BenefitType" AS ENUM ('POINTS_MULTIPLIER', 'EXCLUSIVE_REWARD_ACCESS', 'CUSTOM_BENEFIT');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('POINTS_EARNED_QR', 'POINTS_REDEEMED_REWARD', 'GIFT_REDEEMED', 'POINTS_ADJUSTED_ADMIN', 'TIER_UPGRADE', 'TIER_DOWNGRADE', 'POINTS_EARNED_ORDER_LC');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('RECEIVED', 'IN_PROGRESS', 'PARTIALLY_READY', 'ALL_ITEMS_READY', 'COMPLETED', 'PENDING_PAYMENT', 'PAID', 'CANCELLED', 'PAYMENT_FAILED');

-- CreateEnum
CREATE TYPE "OrderItemStatus" AS ENUM ('PENDING_KDS', 'PREPARING', 'READY', 'SERVED', 'CANCELLED', 'CANCELLATION_REQUESTED');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('DINE_IN', 'TAKE_AWAY', 'DELIVERY');

-- CreateEnum
CREATE TYPE "TableNotificationType" AS ENUM ('CALL_WAITER', 'REQUEST_BILL');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'SEATED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "TableStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'PENDING_PAYMENT_TABLE', 'NEEDS_CLEANING', 'RESERVED');

-- CreateEnum
CREATE TYPE "SuperAdminActionType" AS ENUM ('BUSINESS_STATUS_TOGGLED', 'MODULE_LOYALTY_TOGGLED', 'MODULE_CAMARERO_TOGGLED', 'SUBSCRIPTION_PRICE_UPDATED', 'MANUAL_PAYMENT_RECORDED', 'IMPERSONATION_STARTED', 'IMPERSONATION_ENDED');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('MENU_ITEM', 'DISCOUNT_ON_ITEM', 'DISCOUNT_ON_TOTAL');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

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
    "businessId" TEXT NOT NULL,
    "name_es" TEXT NOT NULL,
    "name_en" TEXT,
    "description_es" TEXT,
    "description_en" TEXT,
    "imageUrl" TEXT,
    "pointsCost" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "type" "RewardType" NOT NULL DEFAULT 'DISCOUNT_ON_TOTAL',
    "discountType" "DiscountType",
    "discountValue" DECIMAL(10,2),
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "usageLimit" INTEGER,
    "usageLimitPerUser" INTEGER,
    "requiredTierId" TEXT,
    "isStackable" BOOLEAN NOT NULL DEFAULT false,
    "linkedMenuItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "sku" TEXT,
    "name_es" TEXT NOT NULL,
    "name_en" TEXT,
    "description_es" TEXT,
    "description_en" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "imageUrl" TEXT,
    "allergens" TEXT[],
    "tags" TEXT[],
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "preparationTime" INTEGER,
    "calories" INTEGER,
    "kdsDestination" TEXT,
    "categoryId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "trackInventory" BOOLEAN NOT NULL DEFAULT false,
    "stockQuantity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'RECEIVED',
    "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "discountAmount" DECIMAL(10,2),
    "finalAmount" DECIMAL(10,2),
    "notes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'CUSTOMER_APP',
    "tableId" TEXT,
    "customerLCoId" TEXT,
    "waiterId" TEXT,
    "businessId" TEXT NOT NULL,
    "appliedLcoRewardId" TEXT,
    "appliedLcoRewardDiscountAmount" DECIMAL(10,2),
    "appliedLcoTierBenefitDiscountAmount" DOUBLE PRECISION,
    "isBillRequested" BOOLEAN NOT NULL DEFAULT false,
    "paidByUserId" TEXT,
    "paymentMethodUsed" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "billedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "orderType" "OrderType" NOT NULL DEFAULT 'DINE_IN',
    "paymentMethodPreference" TEXT,
    "amountToPayWith" TEXT,
    "paymentIntentId" TEXT,
    "paymentProvider" TEXT,
    "deliveryAddressJson" TEXT,
    "deliveryFee" DOUBLE PRECISION,
    "estimatedDeliveryTime" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "priceAtPurchase" DECIMAL(10,2) NOT NULL,
    "totalItemPrice" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "status" "OrderItemStatus" NOT NULL DEFAULT 'PENDING_KDS',
    "kdsDestination" TEXT,
    "orderId" TEXT NOT NULL,
    "menuItemId" TEXT,
    "itemNameSnapshot" TEXT,
    "itemDescriptionSnapshot" TEXT,
    "servedById" TEXT,
    "preparedAt" TIMESTAMP(3),
    "servedAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "redeemedRewardId" TEXT,
    "appliedDiscountRewardId" TEXT,
    "appliedDiscountAmount" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "Tier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "minValue" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "benefitsDescription" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "businessId" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "pointsChanged" INTEGER,
    "description" TEXT,
    "relatedRewardId" TEXT,
    "relatedQrId" TEXT,
    "relatedGrantedRewardId" TEXT,
    "relatedOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "Table" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "zone" TEXT,
    "capacity" INTEGER,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "businessId" TEXT NOT NULL,
    "status" "TableStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuCategory" (
    "id" TEXT NOT NULL,
    "name_es" TEXT NOT NULL,
    "name_en" TEXT,
    "description_es" TEXT,
    "description_en" TEXT,
    "imageUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModifierGroup" (
    "id" TEXT NOT NULL,
    "name_es" TEXT NOT NULL,
    "name_en" TEXT,
    "uiType" TEXT NOT NULL DEFAULT 'RADIO',
    "minSelections" INTEGER NOT NULL DEFAULT 0,
    "maxSelections" INTEGER NOT NULL DEFAULT 1,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "menuItemId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModifierGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModifierOption" (
    "id" TEXT NOT NULL,
    "name_es" TEXT NOT NULL,
    "name_en" TEXT,
    "priceAdjustment" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModifierOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItemModifierOption" (
    "orderItemId" TEXT NOT NULL,
    "modifierOptionId" TEXT NOT NULL,
    "optionNameSnapshot" TEXT,
    "optionPriceAdjustmentSnapshot" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItemModifierOption_pkey" PRIMARY KEY ("orderItemId","modifierOptionId")
);

-- CreateTable
CREATE TABLE "StaffPin" (
    "id" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffPin_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "businesses_slug_key" ON "businesses"("slug");

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
CREATE INDEX "Reward_businessId_isActive_type_idx" ON "Reward"("businessId", "isActive", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Reward_businessId_name_es_key" ON "Reward"("businessId", "name_es");

-- CreateIndex
CREATE INDEX "MenuItem_businessId_idx" ON "MenuItem"("businessId");

-- CreateIndex
CREATE INDEX "MenuItem_categoryId_idx" ON "MenuItem"("categoryId");

-- CreateIndex
CREATE INDEX "MenuItem_isAvailable_idx" ON "MenuItem"("isAvailable");

-- CreateIndex
CREATE INDEX "MenuItem_sku_idx" ON "MenuItem"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItem_categoryId_name_es_key" ON "MenuItem"("categoryId", "name_es");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItem_businessId_sku_key" ON "MenuItem"("businessId", "sku");

-- CreateIndex
CREATE INDEX "Order_businessId_status_idx" ON "Order"("businessId", "status");

-- CreateIndex
CREATE INDEX "Order_tableId_idx" ON "Order"("tableId");

-- CreateIndex
CREATE INDEX "Order_customerLCoId_idx" ON "Order"("customerLCoId");

-- CreateIndex
CREATE INDEX "Order_waiterId_idx" ON "Order"("waiterId");

-- CreateIndex
CREATE INDEX "Order_orderType_idx" ON "Order"("orderType");

-- CreateIndex
CREATE INDEX "Order_paidByUserId_idx" ON "Order"("paidByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_businessId_orderNumber_key" ON "Order"("businessId", "orderNumber");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_menuItemId_idx" ON "OrderItem"("menuItemId");

-- CreateIndex
CREATE INDEX "OrderItem_servedById_idx" ON "OrderItem"("servedById");

-- CreateIndex
CREATE INDEX "OrderItem_status_idx" ON "OrderItem"("status");

-- CreateIndex
CREATE INDEX "OrderItem_kdsDestination_idx" ON "OrderItem"("kdsDestination");

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

-- CreateIndex
CREATE UNIQUE INDEX "QrCode_token_key" ON "QrCode"("token");

-- CreateIndex
CREATE INDEX "QrCode_businessId_idx" ON "QrCode"("businessId");

-- CreateIndex
CREATE INDEX "QrCode_userId_idx" ON "QrCode"("userId");

-- CreateIndex
CREATE INDEX "Tier_businessId_idx" ON "Tier"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "Tier_businessId_name_key" ON "Tier"("businessId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Tier_businessId_level_key" ON "Tier"("businessId", "level");

-- CreateIndex
CREATE INDEX "TierBenefit_tierId_idx" ON "TierBenefit"("tierId");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_businessId_idx" ON "ActivityLog"("businessId");

-- CreateIndex
CREATE INDEX "ActivityLog_type_idx" ON "ActivityLog"("type");

-- CreateIndex
CREATE INDEX "ActivityLog_relatedRewardId_idx" ON "ActivityLog"("relatedRewardId");

-- CreateIndex
CREATE INDEX "ActivityLog_relatedQrId_idx" ON "ActivityLog"("relatedQrId");

-- CreateIndex
CREATE INDEX "ActivityLog_relatedGrantedRewardId_idx" ON "ActivityLog"("relatedGrantedRewardId");

-- CreateIndex
CREATE INDEX "ActivityLog_relatedOrderId_idx" ON "ActivityLog"("relatedOrderId");

-- CreateIndex
CREATE INDEX "GrantedReward_userId_idx" ON "GrantedReward"("userId");

-- CreateIndex
CREATE INDEX "GrantedReward_rewardId_idx" ON "GrantedReward"("rewardId");

-- CreateIndex
CREATE INDEX "GrantedReward_assignedById_idx" ON "GrantedReward"("assignedById");

-- CreateIndex
CREATE INDEX "GrantedReward_businessId_idx" ON "GrantedReward"("businessId");

-- CreateIndex
CREATE INDEX "Table_businessId_idx" ON "Table"("businessId");

-- CreateIndex
CREATE INDEX "Table_businessId_status_idx" ON "Table"("businessId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Table_businessId_identifier_key" ON "Table"("businessId", "identifier");

-- CreateIndex
CREATE INDEX "MenuCategory_businessId_idx" ON "MenuCategory"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuCategory_businessId_name_es_key" ON "MenuCategory"("businessId", "name_es");

-- CreateIndex
CREATE INDEX "ModifierGroup_menuItemId_idx" ON "ModifierGroup"("menuItemId");

-- CreateIndex
CREATE INDEX "ModifierGroup_businessId_idx" ON "ModifierGroup"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "ModifierGroup_menuItemId_name_es_key" ON "ModifierGroup"("menuItemId", "name_es");

-- CreateIndex
CREATE INDEX "ModifierOption_groupId_idx" ON "ModifierOption"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "ModifierOption_groupId_name_es_key" ON "ModifierOption"("groupId", "name_es");

-- CreateIndex
CREATE INDEX "OrderItemModifierOption_orderItemId_idx" ON "OrderItemModifierOption"("orderItemId");

-- CreateIndex
CREATE INDEX "OrderItemModifierOption_modifierOptionId_idx" ON "OrderItemModifierOption"("modifierOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffPin_userId_key" ON "StaffPin"("userId");

-- CreateIndex
CREATE INDEX "StaffPin_businessId_idx" ON "StaffPin"("businessId");

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

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_currentTierId_fkey" FOREIGN KEY ("currentTierId") REFERENCES "Tier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_requiredTierId_fkey" FOREIGN KEY ("requiredTierId") REFERENCES "Tier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_linkedMenuItemId_fkey" FOREIGN KEY ("linkedMenuItemId") REFERENCES "MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MenuCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerLCoId_fkey" FOREIGN KEY ("customerLCoId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_waiterId_fkey" FOREIGN KEY ("waiterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_appliedLcoRewardId_fkey" FOREIGN KEY ("appliedLcoRewardId") REFERENCES "Reward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_paidByUserId_fkey" FOREIGN KEY ("paidByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_servedById_fkey" FOREIGN KEY ("servedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_redeemedRewardId_fkey" FOREIGN KEY ("redeemedRewardId") REFERENCES "Reward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_appliedDiscountRewardId_fkey" FOREIGN KEY ("appliedDiscountRewardId") REFERENCES "Reward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_payments" ADD CONSTRAINT "business_payments_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_payments" ADD CONSTRAINT "business_payments_recordedByAdminId_fkey" FOREIGN KEY ("recordedByAdminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "superadmin_activity_logs" ADD CONSTRAINT "superadmin_activity_logs_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "superadmin_activity_logs" ADD CONSTRAINT "superadmin_activity_logs_targetBusinessId_fkey" FOREIGN KEY ("targetBusinessId") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrCode" ADD CONSTRAINT "QrCode_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrCode" ADD CONSTRAINT "QrCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tier" ADD CONSTRAINT "Tier_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierBenefit" ADD CONSTRAINT "TierBenefit_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "Tier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_relatedRewardId_fkey" FOREIGN KEY ("relatedRewardId") REFERENCES "Reward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_relatedQrId_fkey" FOREIGN KEY ("relatedQrId") REFERENCES "QrCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_relatedGrantedRewardId_fkey" FOREIGN KEY ("relatedGrantedRewardId") REFERENCES "GrantedReward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_relatedOrderId_fkey" FOREIGN KEY ("relatedOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantedReward" ADD CONSTRAINT "GrantedReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantedReward" ADD CONSTRAINT "GrantedReward_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantedReward" ADD CONSTRAINT "GrantedReward_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantedReward" ADD CONSTRAINT "GrantedReward_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuCategory" ADD CONSTRAINT "MenuCategory_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModifierGroup" ADD CONSTRAINT "ModifierGroup_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModifierGroup" ADD CONSTRAINT "ModifierGroup_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModifierOption" ADD CONSTRAINT "ModifierOption_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ModifierGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemModifierOption" ADD CONSTRAINT "OrderItemModifierOption_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemModifierOption" ADD CONSTRAINT "OrderItemModifierOption_modifierOptionId_fkey" FOREIGN KEY ("modifierOptionId") REFERENCES "ModifierOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffPin" ADD CONSTRAINT "StaffPin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffPin" ADD CONSTRAINT "StaffPin_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableNotification" ADD CONSTRAINT "TableNotification_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableNotification" ADD CONSTRAINT "TableNotification_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableNotification" ADD CONSTRAINT "TableNotification_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE SET NULL ON UPDATE CASCADE;
