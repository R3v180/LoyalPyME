// frontend/src/types/customer.ts
// Version: 1.1.1 (Ensure all Staff roles and consistency)

import React from 'react';

export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    BUSINESS_ADMIN = 'BUSINESS_ADMIN',
    CUSTOMER_FINAL = 'CUSTOMER_FINAL',
    WAITER = 'WAITER',
    KITCHEN_STAFF = 'KITCHEN_STAFF',
    BAR_STAFF = 'BAR_STAFF'
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
  isActive?: boolean; // Confirmar si este campo es enviado por el backend para el cliente
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
    role: UserRole; // Usa el enum definido arriba
    businessId: string | null;
    isActive: boolean;
    points?: number;
    totalSpend?: number;
    totalVisits?: number;
    currentTier?: {
        id: string;
        name: string;
        benefits: TierBenefitData[]; // Asumiendo que TierBenefitData es el tipo correcto aquí
    } | null;
    businessIsActive?: boolean;
    isLoyaltyCoreActive?: boolean;
    isCamareroActive?: boolean;
    businessName?: string | null;      
    businessSlug?: string | null;      
    businessLogoUrl?: string | null;   
}
// ... (El resto de tipos: Reward, GrantedReward, DisplayReward, etc., se mantienen como en la versión 1.1.0 que te di)

// Interfaz Reward (con campos i18n)
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
}

// Interfaz GrantedReward (para regalos otorgados)
export interface GrantedReward {
    id: string;
    status: string; 
    assignedAt: string; 
    reward: Pick<Reward, 'id' | 'name_es' | 'name_en' | 'description_es' | 'description_en' | 'imageUrl'>; 
    assignedBy?: { name?: string | null; email: string; } | null; 
    business?: { name: string; } | null; 
}

// Tipo DisplayReward (para unificar la visualización de recompensas y regalos)
export type DisplayReward =
    {
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
    } |
    {
        isGift: true;
        grantedRewardId: string; 
        id: string; // ID de la recompensa base
        name_es: string | null;
        name_en: string | null;
        description_es?: string | null;
        description_en?: string | null;
        pointsCost: 0; 
        imageUrl?: string | null;
        assignedByString: string; 
        assignedAt: string; 
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
    | 'POINTS_ADJUSTED_ADMIN';

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