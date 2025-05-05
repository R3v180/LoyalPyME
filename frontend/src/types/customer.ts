// filename: frontend/src/types/customer.ts
// Version: 1.5.1 (Internationalize Reward, GrantedReward, DisplayReward types - COMPLETE FILE)

import React from 'react';

// Enum para TierCalculationBasis
export enum TierCalculationBasis {
    SPEND = 'SPEND',
    VISITS = 'VISITS',
    POINTS_EARNED = 'POINTS_EARNED'
}

// Interfaz para Configuración del Negocio
export interface CustomerBusinessConfig {
    tierCalculationBasis: TierCalculationBasis | null;
}

// Interfaz para Datos del Beneficio
export interface TierBenefitData {
  id: string;
  type: string; // Considerar usar un enum si los tipos son fijos
  value: string;
  description: string | null;
  // isActive?: boolean; // Podría añadirse si el backend lo devuelve y se necesita
}

// Interfaz para Datos del Tier (Con benefits opcional)
export interface TierData {
    id: string;
    name: string;
    level: number;
    minValue: number;
    isActive: boolean;
    benefits?: TierBenefitData[];
}

// Interfaz para Datos del Usuario
export interface UserData {
    id: string;
    email: string;
    name?: string | null;
    points: number;
    role: string;
    totalSpend: number;
    totalVisits: number;
    currentTier?: {
        id: string;
        name: string;
        benefits: TierBenefitData[];
    } | null;
    businessId?: string;
}

// --- Interfaz Reward ACTUALIZADA ---
export interface Reward {
    id: string;
    // name: string; // Eliminado
    // description?: string | null; // Eliminado
    name_es: string | null; // Nuevo campo (opcional por la migración)
    name_en: string | null; // Nuevo campo (opcional por la migración)
    description_es?: string | null; // Nuevo campo
    description_en?: string | null; // Nuevo campo
    pointsCost: number;
    isActive: boolean;
    businessId?: string;
    imageUrl?: string | null;
    createdAt?: string; // Añadido opcionalmente
    updatedAt?: string; // Añadido opcionalmente
}
// --- FIN Interfaz Reward ---

// --- Interfaz GrantedReward ACTUALIZADA ---
export interface GrantedReward {
    id: string;
    status: string;
    assignedAt: string;
    // Actualizar la forma de 'reward' para usar los campos i18n
    // Usamos Pick para tomar solo los campos necesarios de la interfaz Reward completa
    reward: Pick<Reward, 'id' | 'name_es' | 'name_en' | 'description_es' | 'description_en' | 'imageUrl'>;
    assignedBy?: {
        name?: string | null;
        email: string;
    } | null;
    business?: {
        name: string;
    } | null;
}
// --- FIN Interfaz GrantedReward ---

// --- TIPO DisplayReward ACTUALIZADO ---
export type DisplayReward =
    {
        isGift: false;
        id: string;
        // name: string; // Eliminado
        name_es: string | null; // Añadido
        name_en: string | null; // Añadido
        description_es?: string | null; // Añadido
        description_en?: string | null; // Añadido
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
        // name: string; // Eliminado
        name_es: string | null; // Añadido (del Pick en GrantedReward)
        name_en: string | null; // Añadido (del Pick en GrantedReward)
        description_es?: string | null; // Añadido
        description_en?: string | null; // Añadido
        pointsCost: 0; // Sigue siendo 0 para regalos
        imageUrl?: string | null;
        assignedByString: string; // Se calcula en el hook
        assignedAt: string;
    };
// --- FIN TIPO DisplayReward ---


// Interface para el resultado del hook useUserProfileData
export interface UseProfileResult {
    userData: UserData | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    setUserData: React.Dispatch<React.SetStateAction<UserData | null>>;
}

// Interfaz para Resultado del Hook useCustomerTierData
export interface UseCustomerTierDataResult {
    allTiers: TierData[] | null;
    businessConfig: CustomerBusinessConfig | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

// --- Tipos Añadidos para Historial de Actividad (Sin cambios aquí) ---
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
// --- Fin Tipos Añadidos ---

// End of File: frontend/src/types/customer.ts