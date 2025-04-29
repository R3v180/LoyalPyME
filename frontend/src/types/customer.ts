// filename: frontend/src/types/customer.ts
// Version: 1.0.1 (Fix encoding, remove obsolete type)

// Interfaces para los datos del usuario
export interface UserData {
    id: string;
    email: string;
    name?: string | null;
    points: number;
    role: string; // Puede ser UserRole enum si se importa globalmente
    currentTier?: {
        id: string;
        name: string;
    } | null;
    // Añadir businessId si es necesario en más sitios del frontend
    businessId?: string; // Hacer opcional si no siempre está presente
}

// Interface para las recompensas canjeables por puntos
export interface Reward {
    id: string;
    name: string;
    description?: string | null;
    pointsCost: number;
    isActive: boolean; // Importante para filtrar en el hook/componente
    businessId?: string;
    // Añadir createdAt/updatedAt si se usan en la UI
}

// Interface para los datos de una recompensa otorgada (regalo)
export interface GrantedReward {
    id: string; // ID de la instancia GrantedReward
    status: string; // Ej: 'PENDING', 'REDEEMED'
    assignedAt: string; // Fecha de asignación
    reward: { // Información básica de la recompensa base
        id: string;
        name: string;
        description?: string | null;
    };
    assignedBy?: { // Quién asignó (si es un User) // Corregido: Quién, asignó
        name?: string | null;
        email: string;
    } | null;
    business?: { // Información del negocio (si es asignado por sistema) // Corregido: Información
        name: string;
    } | null;
}

// Tipo combinado para mostrar recompensas y regalos en una sola lista
export type DisplayReward =
    { isGift: false; id: string; name: string; description?: string | null; pointsCost: number; grantedRewardId?: undefined; assignedByString?: undefined; assignedAt?: undefined; } |
    { isGift: true; grantedRewardId: string; id: string; name: string; description?: string | null; pointsCost: 0; assignedByString: string; assignedAt: string; };

// Interface para el resultado del hook useUserProfileData (con nombres estandarizados)
export interface UseProfileResult {
    userData: UserData | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

// Interface para el resultado del hook useCustomerRewardsData
// Nota: El hook useCustomerRewardsAndGifts fue eliminado, por lo que su tipo también
// export interface UseRewardsAndGiftsResult { ... } // <-- ELIMINADO

// Podríamos añadir aquí también la interfaz para useCustomerRewardsData si queremos
// export interface UseCustomerRewardsDataResult { ... }
// Pero por ahora, está definida dentro del propio hook.

// End of File: frontend/src/types/customer.ts