// filename: frontend/src/types/customer.ts
// Version: 1.3.0 (Add imageUrl to DisplayReward)

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

// Interfaz para Datos del Tier
export interface TierData {
    id: string;
    name: string;
    level: number;
    minValue: number;
    isActive: boolean;
    benefits?: TierBenefitData[]; // Beneficios opcionales
    // Si el backend siempre los devuelve (incluso vacío), quitar '?'
}

// Interfaz para Datos del Beneficio
export interface TierBenefitData {
  id: string;
  type: string; // Considerar usar un enum si los tipos son fijos
  value: string;
  description: string | null;
  // isActive?: boolean; // Podría añadirse si el backend lo devuelve y se necesita
}

// Interfaz para Datos del Usuario (podría expandirse)
export interface UserData {
    id: string;
    email: string;
    name?: string | null;
    points: number;
    role: string; // 'CUSTOMER_FINAL', 'BUSINESS_ADMIN', etc.
    totalSpend: number;
    totalVisits: number;
    currentTier?: { // El nivel actual del usuario
        id: string;
        name: string;
        benefits: TierBenefitData[]; // Los beneficios activos de ESE nivel
    } | null;
    businessId?: string; // ID del negocio al que pertenece
    // otros campos como isActive, createdAt podrían ser útiles
}

// Interfaz para Recompensas por Puntos (obtenidas de /customer/rewards)
// Asegúrate que coincida con lo que devuelve tu API
export interface Reward {
    id: string;
    name: string;
    description?: string | null;
    pointsCost: number;
    isActive: boolean; // Confirmar si viene de la API de cliente
    businessId?: string;
    imageUrl?: string | null; // <-- Añadido
}

// Interfaz para Recompensas Otorgadas (Regalos) (obtenidas de /customer/granted-rewards)
// Asegúrate que coincida con lo que devuelve tu API
export interface GrantedReward {
    id: string; // ID de la instancia GrantedReward
    status: string; // 'PENDING', etc.
    assignedAt: string;
    reward: { // La recompensa base asociada
        id: string;
        name: string;
        description?: string | null;
        imageUrl?: string | null; // <-- Añadido aquí también
    };
    assignedBy?: {
        name?: string | null;
        email: string;
    } | null;
    business?: {
        name: string;
    } | null;
}

// --- TIPO CORREGIDO ---
// Tipo Combinado para Mostrar Recompensas/Regalos en la UI
export type DisplayReward =
    {
        isGift: false;
        id: string;
        name: string;
        description?: string | null;
        pointsCost: number;
        imageUrl?: string | null; // <-- CORREGIDO
        grantedRewardId?: undefined;
        assignedByString?: undefined;
        assignedAt?: undefined;
    } |
    {
        isGift: true;
        grantedRewardId: string;
        id: string; // ID de la recompensa base
        name: string;
        description?: string | null;
        pointsCost: 0;
        imageUrl?: string | null; // <-- CORREGIDO
        assignedByString: string;
        assignedAt: string;
    };
// --- FIN TIPO CORREGIDO ---


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

// End of File: frontend/src/types/customer.ts