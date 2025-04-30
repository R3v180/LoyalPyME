// filename: frontend/src/types/customer.ts
// Version: 1.2.1 (Add setUserData to UseProfileResult type)

import React from 'react'; // Asegurar que React está disponible para React.Dispatch

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

// Interfaz para Datos del Tier
export interface TierData {
    id: string;
    name: string;
    level: number;
    minValue: number;
    isActive: boolean;
    // --- IMPORTANTE: Añadir benefits aquí también para que esté completo ---
    benefits?: TierBenefitData[]; // Hacer opcional o asegurar que siempre se devuelve
}

// Interfaz para Datos del Beneficio
export interface TierBenefitData {
  id: string;
  type: string;
  value: string;
  description: string | null;
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

// Interfaz para Recompensas por Puntos
export interface Reward {
    id: string;
    name: string;
    description?: string | null;
    pointsCost: number;
    isActive: boolean;
    businessId?: string;
}

// Interfaz para Recompensas Otorgadas (Regalos)
export interface GrantedReward {
    id: string;
    status: string;
    assignedAt: string;
    reward: {
        id: string;
        name: string;
        description?: string | null;
    };
    assignedBy?: {
        name?: string | null;
        email: string;
    } | null;
    business?: {
        name: string;
    } | null;
}

// Tipo Combinado para Mostrar Recompensas/Regalos
export type DisplayReward =
    { isGift: false; id: string; name: string; description?: string | null; pointsCost: number; grantedRewardId?: undefined; assignedByString?: undefined; assignedAt?: undefined; } |
    { isGift: true; grantedRewardId: string; id: string; name: string; description?: string | null; pointsCost: 0; assignedByString: string; assignedAt: string; };

// Interface para el resultado del hook useUserProfileData (MODIFICADA)
export interface UseProfileResult {
    userData: UserData | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    // --- NUEVO: Añadir la función para actualizar el estado ---
    setUserData: React.Dispatch<React.SetStateAction<UserData | null>>;
    // --- FIN NUEVO ---
}

// Interfaz para Resultado del Hook useCustomerTierData (Se mantiene)
export interface UseCustomerTierDataResult {
    allTiers: TierData[] | null;
    businessConfig: CustomerBusinessConfig | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

// End of File: frontend/src/types/customer.ts