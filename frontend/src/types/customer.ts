// filename: frontend/src/types/customer.ts
// Version: 1.5.0 (Add types for Activity Log)

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

// Interfaz para Datos del Tier (ACTUALIZADA)
export interface TierData {
    id: string;
    name: string;
    level: number;
    minValue: number;
    isActive: boolean;
    benefits?: TierBenefitData[]; // <-- Propiedad opcional añadida previamente
}

// Interfaz para Datos del Usuario (podría expandirse)
export interface UserData {
    id: string;
    email: string;
    name?: string | null;
    points: number; // <-- Definido como number
    role: string; // 'CUSTOMER_FINAL', 'BUSINESS_ADMIN', etc.
    totalSpend: number; // <-- Definido como number
    totalVisits: number; // <-- Definido como number
    currentTier?: { // El nivel actual del usuario
        id: string;
        name: string;
        benefits: TierBenefitData[]; // Los beneficios activos de ESE nivel
    } | null;
    businessId?: string; // ID del negocio al que pertenece
    // otros campos como isActive, createdAt podrían ser útiles
}

// Interfaz para Recompensas por Puntos (obtenidas de /customer/rewards)
export interface Reward {
    id: string;
    name: string;
    description?: string | null;
    pointsCost: number;
    isActive: boolean;
    businessId?: string;
    imageUrl?: string | null;
}

// Interfaz para Recompensas Otorgadas (Regalos) (obtenidas de /customer/granted-rewards)
export interface GrantedReward {
    id: string; // ID de la instancia GrantedReward
    status: string; // 'PENDING', etc.
    assignedAt: string;
    reward: { // La recompensa base asociada
        id: string;
        name: string;
        description?: string | null;
        imageUrl?: string | null;
    };
    assignedBy?: {
        name?: string | null;
        email: string;
    } | null;
    business?: {
        name: string;
    } | null;
}

// Tipo Combinado para Mostrar Recompensas/Regalos en la UI
export type DisplayReward =
    {
        isGift: false;
        id: string;
        name: string;
        description?: string | null;
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
        name: string;
        description?: string | null;
        pointsCost: 0;
        imageUrl?: string | null;
        assignedByString: string;
        assignedAt: string;
    };


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

// --- Tipos Añadidos para Historial de Actividad ---

// Simula el Enum del backend para los tipos de actividad
export type ActivityType =
    | 'POINTS_EARNED_QR'
    | 'POINTS_REDEEMED_REWARD'
    | 'GIFT_REDEEMED'
    | 'POINTS_ADJUSTED_ADMIN';

// Interfaz para un item individual del log de actividad
export interface ActivityLogItem {
  id: string;
  type: ActivityType;
  pointsChanged: number | null; // Puntos +/- o null
  description: string | null;   // Descripción del evento
  createdAt: string;           // Fecha como string ISO
  // Podrían añadirse IDs relacionados si se necesitaran mostrar detalles:
  // relatedRewardId?: string | null;
  // relatedGrantedRewardId?: string | null;
}

// Interfaz para la respuesta paginada de la API de actividad
export interface PaginatedActivityResponse {
  logs: ActivityLogItem[]; // El array de logs de la página actual
  totalPages: number;      // Número total de páginas
  currentPage: number;     // Página actual devuelta
  totalItems: number;      // Número total de items en el historial
}

// --- Fin Tipos Añadidos ---


// End of File: frontend/src/types/customer.ts