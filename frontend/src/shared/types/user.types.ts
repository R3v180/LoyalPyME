// frontend/src/shared/types/user.types.ts
// VERSIÓN 2.0.2: `discountValue` ahora es `any` para máxima flexibilidad en la deserialización.

import React from 'react';
import { RewardType, DiscountType } from './enums';

export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    BUSINESS_ADMIN = 'BUSINESS_ADMIN',
    CUSTOMER_FINAL = 'CUSTOMER_FINAL',
    WAITER = 'WAITER',
    KITCHEN_STAFF = 'KITCHEN_STAFF',
    BAR_STAFF = 'BAR_STAFF'
}

export enum OrderItemStatus {
    PENDING_KDS = 'PENDING_KDS', PREPARING = 'PREPARING', READY = 'READY',
    SERVED = 'SERVED', CANCELLED = 'CANCELLED', CANCELLATION_REQUESTED = 'CANCELLATION_REQUESTED',
}

export enum OrderStatus {
    RECEIVED = 'RECEIVED', IN_PROGRESS = 'IN_PROGRESS', PARTIALLY_READY = 'PARTIALLY_READY',
    ALL_ITEMS_READY = 'ALL_ITEMS_READY', COMPLETED = 'COMPLETED', PENDING_PAYMENT = 'PENDING_PAYMENT',
    PAID = 'PAID', CANCELLED = 'CANCELLED', PAYMENT_FAILED = 'PAYMENT_FAILED',
}

export enum OrderType {
  DINE_IN = 'DINE_IN',
  TAKE_AWAY = 'TAKE_AWAY',
  DELIVERY = 'DELIVERY',
}

export enum TierCalculationBasis {
    SPEND = 'SPEND',
    VISITS = 'VISITS',
    POINTS_EARNED = 'POINTS_EARNED'
}

export interface CustomerBusinessConfig {
    tierCalculationBasis: TierCalculationBasis | null;
}

export interface TierBenefitData {
  id: string;
  type: string;
  value: string;
  description: string | null;
  isActive?: boolean;
}

export interface TierData {
    id: string;
    name: string;
    level: number;
    minValue: number;
    isActive: boolean;
    benefits?: TierBenefitData[];
}

export interface UserData {
    id: string;
    email: string;
    name?: string | null;
    phone?: string | null;
    imageUrl?: string | null;
    role: UserRole;
    businessId: string | null;
    isActive: boolean;
    points?: number;
    totalSpend?: number;
    totalVisits?: number;
    currentTier?: {
        id: string;
        name: string;
        benefits: TierBenefitData[];
    } | null;
    businessIsActive?: boolean;
    isLoyaltyCoreActive?: boolean;
    isCamareroActive?: boolean;
    businessName?: string | null;
    businessSlug?: string | null;
    businessLogoUrl?: string | null;
}

export interface Reward {
    id: string;
    name_es: string | null;
    name_en: string | null;
    description_es?: string | null;
    description_en?: string | null;
    pointsCost: number;
    isActive: boolean;
    businessId?: string;
    imageUrl?: string | null;
    createdAt?: string;
    updatedAt?: string;
    type: RewardType;
    linkedMenuItemId: string | null;
    discountType: DiscountType | null;
    // --- CORRECCIÓN CLAVE ---
    // Aceptamos CUALQUIER tipo que venga de la API (string, number, objeto Decimal serializado)
    // para evitar errores de tipado en la deserialización. La conversión a número se hará
    // en el componente que lo necesite (ApplyRewardModal).
    discountValue: any;
    // --- FIN CORRECCIÓN ---
    validFrom: string | null;
    validUntil: string | null;
    usageLimit: number | null;
    usageLimitPerUser: number | null;
    requiredTierId: string | null;
    isStackable: boolean;
    kdsDestination?: string | null;
}

export interface GrantedReward {
    id: string;
    status: string;
    assignedAt: string;
    redeemedAt: string | null;
    expiresAt: string | null;
    reward: Reward; 
    assignedBy?: { name?: string | null; email: string; } | null;
    business?: { name: string; } | null;
}

export type DisplayReward =
    ({
        isGift: false;
        id: string;
        name_es: string | null;
        name_en: string | null;
        description_es?: string | null;
        description_en?: string | null;
        pointsCost: number;
        imageUrl?: string | null;
        grantedRewardId?: undefined;
        assignedByString?: undefined;
        assignedAt?: undefined;
        type: RewardType;
        linkedMenuItemId: string | null;
        discountType: DiscountType | null;
        discountValue: number | null;
    }) |
    {
        isGift: true;
        grantedRewardId: string;
        id: string;
        name_es: string | null;
        name_en: string | null;
        description_es?: string | null;
        description_en?: string | null;
        pointsCost: 0;
        imageUrl?: string | null;
        assignedByString: string;
        assignedAt: string;
        type: RewardType; 
        linkedMenuItemId: string | null; 
        discountType: DiscountType | null; 
        discountValue: number | null;
    };

export interface UseProfileResult {
    userData: UserData | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    setUserData: React.Dispatch<React.SetStateAction<UserData | null>>;
}

export interface UseCustomerTierDataResult {
    allTiers: TierData[] | null;
    businessConfig: CustomerBusinessConfig | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export type ActivityType =
    | 'POINTS_EARNED_QR'
    | 'POINTS_REDEEMED_REWARD'
    | 'GIFT_REDEEMED'
    | 'POINTS_ADJUSTED_ADMIN'
    | 'POINTS_EARNED_ORDER_LC'
    | 'REWARD_ACQUIRED'
    | 'REWARD_APPLIED_TO_ORDER';

export interface ActivityLogItem {
  id: string;
  type: ActivityType;
  pointsChanged: number | null;
  description: string | null;
  createdAt: string;
}

export interface PaginatedActivityResponse {
  logs: ActivityLogItem[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}