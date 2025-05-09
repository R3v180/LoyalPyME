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
  type: string;
  value: string;
  description: string | null;
  // isActive?: boolean; // Si el backend lo devuelve para el cliente
}

// Interfaz para Datos del Tier
export interface TierData {
    id: string;
    name: string;
    level: number;
    minValue: number;
    isActive: boolean;
    benefits?: TierBenefitData[]; // Lista de beneficios del tier
}

// --- Interfaz UserData ACTUALIZADA ---
export interface UserData {
    id: string;
    email: string;
    name?: string | null;
    role: 'SUPER_ADMIN' | 'BUSINESS_ADMIN' | 'CUSTOMER_FINAL'; // Roles como string literal union
    businessId: string | null; // Null para SUPER_ADMIN
    isActive: boolean; // Estado del usuario mismo

    // Campos opcionales que pueden no estar para SUPER_ADMIN
    points?: number;
    totalSpend?: number;
    totalVisits?: number;
    currentTier?: {
        id: string;
        name: string;
        benefits: TierBenefitData[]; // Aseguramos que benefits está aquí si currentTier existe
    } | null;

    // --- NUEVOS CAMPOS: Flags del negocio asociado (si aplica) ---
    businessIsActive?: boolean;     // Estado general del negocio
    isLoyaltyCoreActive?: boolean;  // Flag del módulo LoyalPyME Core
    isCamareroActive?: boolean;     // Flag del módulo LoyalPyME Camarero
}
// --- FIN UserData ACTUALIZADA ---


// Interfaz Reward
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

// Interfaz GrantedReward
export interface GrantedReward {
    id: string;
    status: string;
    assignedAt: string;
    reward: Pick<Reward, 'id' | 'name_es' | 'name_en' | 'description_es' | 'description_en' | 'imageUrl'>;
    assignedBy?: { name?: string | null; email: string; } | null;
    business?: { name: string; } | null;
}

// Tipo DisplayReward
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
        id: string;
        name_es: string | null;
        name_en: string | null;
        description_es?: string | null;
        description_en?: string | null;
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
}

export interface PaginatedActivityResponse {
  logs: ActivityLogItem[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}