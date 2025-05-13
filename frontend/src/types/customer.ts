// frontend/src/types/customer.ts
import React from 'react'; // React se usa para UseProfileResult

// Enum para TierCalculationBasis
export enum TierCalculationBasis {
    SPEND = 'SPEND',
    VISITS = 'VISITS',
    POINTS_EARNED = 'POINTS_EARNED'
}

// Interfaz para Configuración del Negocio que ve el cliente
export interface CustomerBusinessConfig {
    tierCalculationBasis: TierCalculationBasis | null;
}

// Interfaz para Datos del Beneficio de un Tier
export interface TierBenefitData {
  id: string;
  type: string; // Podría ser un enum si los tipos son fijos: 'POINTS_MULTIPLIER' | 'EXCLUSIVE_REWARD_ACCESS' | 'CUSTOM_BENEFIT'
  value: string;
  description: string | null;
  // isActive?: boolean; // Si el backend lo devuelve para el cliente y es necesario
}

// Interfaz para Datos del Tier
export interface TierData {
    id: string;
    name: string;
    level: number;
    minValue: number;
    isActive: boolean;
    benefits?: TierBenefitData[];
}

// --- Interfaz UserData ACTUALIZADA ---
export interface UserData {
    id: string;
    email: string;
    name?: string | null;
    role: 'SUPER_ADMIN' | 'BUSINESS_ADMIN' | 'CUSTOMER_FINAL';
    businessId: string | null;
    isActive: boolean;

    // Campos opcionales (principalmente para CUSTOMER_FINAL, pero BUSINESS_ADMIN podría tenerlos si LCo también es para ellos)
    points?: number;
    totalSpend?: number;
    totalVisits?: number;
    currentTier?: {
        id: string;
        name: string;
        benefits: TierBenefitData[];
    } | null;

    // Flags y detalles del negocio asociado (si aplica, ej. no para SUPER_ADMIN)
    businessIsActive?: boolean;
    isLoyaltyCoreActive?: boolean;
    isCamareroActive?: boolean;
    businessName?: string | null;       // <--- AÑADIDO
    businessSlug?: string | null;       // <--- AÑADIDO
    businessLogoUrl?: string | null;    // <--- AÑADIDO
}
// --- FIN UserData ACTUALIZADA ---


// Interfaz Reward (con campos i18n)
export interface Reward {
    id: string;
    name_es: string | null;
    name_en: string | null;
    description_es?: string | null;
    description_en?: string | null;
    pointsCost: number;
    isActive: boolean;
    businessId?: string; // Puede ser útil
    imageUrl?: string | null;
    createdAt?: string;  // Fecha de creación
    updatedAt?: string;  // Fecha de última actualización
}

// Interfaz GrantedReward (para regalos otorgados)
export interface GrantedReward {
    id: string;
    status: string; // ej: 'PENDING', 'REDEEMED'
    assignedAt: string; // Fecha de asignación
    reward: Pick<Reward, 'id' | 'name_es' | 'name_en' | 'description_es' | 'description_en' | 'imageUrl'>; // Info básica de la recompensa
    assignedBy?: { name?: string | null; email: string; } | null; // Quién la asignó (si es admin)
    business?: { name: string; } | null; // Nombre del negocio (útil si se muestran regalos de varios negocios)
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
        grantedRewardId?: undefined; // Para diferenciar
        assignedByString?: undefined;
        assignedAt?: undefined;
    } |
    {
        isGift: true;
        grantedRewardId: string; // ID único del regalo otorgado
        id: string; // ID de la recompensa base
        name_es: string | null;
        name_en: string | null;
        description_es?: string | null;
        description_en?: string | null;
        pointsCost: 0; // Los regalos no cuestan puntos
        imageUrl?: string | null;
        assignedByString: string; // Nombre/email de quien lo asignó
        assignedAt: string; // Fecha de asignación
    };


// Interface para el resultado del hook useUserProfileData
export interface UseProfileResult {
    userData: UserData | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    setUserData: React.Dispatch<React.SetStateAction<UserData | null>>; // Para actualizar desde fuera si es necesario
}

// Interfaz para Resultado del Hook useCustomerTierData
export interface UseCustomerTierDataResult {
    allTiers: TierData[] | null; // Todos los tiers activos del negocio del cliente
    businessConfig: CustomerBusinessConfig | null; // Configuración del negocio para tiers
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>; // Para recargar datos
}

// Tipos para Historial de Actividad
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
  // Podrías añadir más campos si el backend los devuelve y son útiles:
  // relatedQrId?: string | null;
  // relatedRewardId?: string | null;
  // relatedGrantedRewardId?: string | null;
}

export interface PaginatedActivityResponse {
  logs: ActivityLogItem[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}