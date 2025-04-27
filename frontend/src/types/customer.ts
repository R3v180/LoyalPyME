// filename: frontend/src/types/customer.ts
// Version: 1.0.0

// Interfaces para los datos del usuario
export interface UserData {
    id: string;
    email: string;
    name?: string | null;
    points: number;
    role: string; // Puede ser UserRole enum si se importa, pero string es suficiente aquí
    currentTier?: {
        id: string;
        name: string;
    } | null;
    // Añadir businessId si es necesario en el frontend
    businessId: string;
}

// Interface para las recompensas canjeables por puntos
export interface Reward {
    id: string;
    name: string;
    description?: string | null;
    pointsCost: number;
    isActive: boolean;
    // Añadir businessId si es necesario en el frontend
    businessId?: string; // Optional as it might not be returned on customer endpoint
}

// Interface para los datos de una recompensa otorgada (regalo) tal como viene del backend
export interface GrantedReward {
    id: string; // ID de la instancia GrantedReward
    status: string; // Ej: 'PENDING', 'REDEEMED'
    assignedAt: string;
    // assignedById: string; // Quién lo asignó
    // userId: string; // A quién se le asignó
    // rewardId: string; // La recompensa asociada
    reward: { // Información básica de la recompensa asociada
        id: string;
        name: string;
        description?: string | null;
        // pointsCost: number; // Coste no relevante para regalos
    };
    assignedBy?: { // Información de quién asignó (si es un User)
        name?: string | null;
        email: string;
    } | null;
    business?: { // Información del negocio (si es asignado por sistema/negocio)
        name: string;
    } | null;
}

// Tipo combinado para mostrar recompensas y regalos en una sola lista
export type DisplayReward =
    { isGift: false; id: string; name: string; description?: string | null; pointsCost: number; grantedRewardId?: undefined; assignedByString?: undefined; assignedAt?: undefined; } |
    { isGift: true; grantedRewardId: string; id: string; name: string; description?: string | null; pointsCost: 0; assignedByString: string; assignedAt: string; };

// Interfaces para los datos que los hooks devolverán
export interface UseProfileResult {
    userData: UserData | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export interface UseRewardsAndGiftsResult {
    displayRewards: DisplayReward[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

// End of File: frontend/src/types/customer.ts