// filename: frontend/src/types/customer.ts
// Version: 1.4.0 (Add optional benefits to TierData)

import React from 'react';

// Enum para TierCalculationBasis
export enum TierCalculationBasis {
    SPEND = 'SPEND',
    VISITS = 'VISITS',
    POINTS_EARNED = 'POINTS_EARNED' // [3889]
}

// Interfaz para Configuración del Negocio
export interface CustomerBusinessConfig {
    tierCalculationBasis: TierCalculationBasis | null;
}

// Interfaz para Datos del Tier (ACTUALIZADA)
export interface TierData {
    id: string;
    name: string;
    level: number;
    minValue: number; // [3890]
    isActive: boolean;
    benefits?: TierBenefitData[]; // <-- LÍNEA AÑADIDA (Propiedad opcional)
} // [3891]

// Interfaz para Datos del Beneficio
export interface TierBenefitData {
  id: string;
  type: string; // Considerar usar un enum si los tipos son fijos
  value: string; // [3892]
  description: string | null;
  // isActive?: boolean; // Podría añadirse si el backend lo devuelve y se necesita
} // [3893]

// Interfaz para Datos del Usuario (podría expandirse)
export interface UserData {
    id: string; // [3894]
    email: string;
    name?: string | null;
    points: number;
    role: string; // 'CUSTOMER_FINAL', 'BUSINESS_ADMIN', etc.
    totalSpend: number; // [3895]
    totalVisits: number;
    currentTier?: { // El nivel actual del usuario
        id: string; // [3896]
        name: string;
        benefits: TierBenefitData[]; // Los beneficios activos de ESE nivel
    } | null;
    businessId?: string; // [3897] // ID del negocio al que pertenece
    // otros campos como isActive, createdAt podrían ser útiles
}

// Interfaz para Recompensas por Puntos (obtenidas de /customer/rewards)
// Asegúrate que coincida con lo que devuelve tu API
export interface Reward {
    id: string; // [3898]
    name: string;
    description?: string | null;
    pointsCost: number;
    isActive: boolean; // [3899] // Confirmar si viene de la API de cliente
    businessId?: string;
    imageUrl?: string | null; // [3900] // <-- Añadido
}

// Interfaz para Recompensas Otorgadas (Regalos) (obtenidas de /customer/granted-rewards)
// Asegúrate que coincida con lo que devuelve tu API
export interface GrantedReward {
    id: string; // [3901] // ID de la instancia GrantedReward
    status: string; // 'PENDING', etc.
    assignedAt: string; // [3902]
    reward: { // La recompensa base asociada
        id: string;
        name: string; // [3903]
        description?: string | null;
        imageUrl?: string | null; // <-- Añadido aquí también
    }; // [3904]
    assignedBy?: {
        name?: string | null;
        email: string;
    } | null; // [3905]
    business?: {
        name: string;
    } | null; // [3906]
}

// --- TIPO CORREGIDO ---
// Tipo Combinado para Mostrar Recompensas/Regalos en la UI
export type DisplayReward =
    {
        isGift: false; // [3907]
        id: string;
        name: string;
        description?: string | null;
        pointsCost: number;
        imageUrl?: string | null; // [3908] // <-- CORREGIDO
        grantedRewardId?: undefined;
        assignedByString?: undefined;
        assignedAt?: undefined;
    } | // [3909]
    {
        isGift: true;
        grantedRewardId: string;
        id: string; // [3910] // ID de la recompensa base
        name: string;
        description?: string | null; // [3911]
        pointsCost: 0;
        imageUrl?: string | null; // <-- CORREGIDO
        assignedByString: string;
        assignedAt: string; // [3912]
    };
// --- FIN TIPO CORREGIDO ---


// Interface para el resultado del hook useUserProfileData
export interface UseProfileResult {
    userData: UserData | null; // [3913]
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    setUserData: React.Dispatch<React.SetStateAction<UserData | null>>; // [3914]
}

// Interfaz para Resultado del Hook useCustomerTierData
export interface UseCustomerTierDataResult {
    allTiers: TierData[] | null;
    businessConfig: CustomerBusinessConfig | null; // [3915]
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>; // [3916]
}

// End of File: frontend/src/types/customer.ts