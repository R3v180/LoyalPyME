// filename: frontend/src/hooks/useCustomerRewardsData.ts
// Version: 1.1.0 (Fetch and include imageUrl)

import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../services/axiosInstance';
import { AxiosError } from 'axios';

// --- Interfaces Locales (Actualizadas) ---
// (Estas deberían coincidir con lo que devuelve la API ahora)

interface Reward {
    id: string;
    name: string;
    description?: string | null;
    pointsCost: number;
    isActive: boolean;
    imageUrl?: string | null; // <-- Añadido aquí
}

interface GrantedReward {
    id: string;
    status: string;
    assignedAt: string;
    reward: {
        id: string;
        name: string;
        description?: string | null;
        imageUrl?: string | null; // <-- Añadido aquí (anidado)
    };
    assignedBy?: { name?: string | null; email: string; } | null;
    business?: { name: string; } | null;
}

// Tipo DisplayReward (Importado o definido localmente, ya debería tener imageUrl)
// Asegúrate que este tipo en src/types/customer.ts ya incluye imageUrl
import { DisplayReward } from '../types/customer';


// Tipo de Retorno del Hook (sin cambios en la estructura)
interface UseCustomerRewardsDataReturn {
    displayRewards: DisplayReward[];
    loadingRewards: boolean;
    loadingGrantedRewards: boolean;
    errorRewards: string | null;
    refreshRewards: () => Promise<void>;
}

/**
 * Hook para obtener y gestionar las recompensas normales y los regalos (granted rewards)
 * disponibles para el cliente, combinándolos para su visualización.
 */
export const useCustomerRewardsData = (): UseCustomerRewardsDataReturn => {
    // Estados Internos (sin cambios)
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [grantedRewards, setGrantedRewards] = useState<GrantedReward[]>([]);
    const [displayRewards, setDisplayRewards] = useState<DisplayReward[]>([]);
    const [loadingRewards, setLoadingRewards] = useState<boolean>(true);
    const [loadingGrantedRewards, setLoadingGrantedRewards] = useState<boolean>(true);
    const [errorRewards, setErrorRewards] = useState<string | null>(null);

    // Función para Cargar Ambos Tipos de Recompensas (sin cambios en la lógica de fetch)
    const fetchRewardsData = useCallback(async () => {
        console.log('[useCustomerRewardsData] Fetching rewards data...');
        setLoadingRewards(true);
        setLoadingGrantedRewards(true);
        setErrorRewards(null);

        try {
            const [rewardsResponse, grantedRewardsResponse] = await Promise.all([
                axiosInstance.get<Reward[]>('/customer/rewards'),
                axiosInstance.get<GrantedReward[]>('/customer/granted-rewards')
            ]);

             // --- CORRECCIÓN: Usar los tipos actualizados al recibir datos ---
            setRewards(rewardsResponse.data?.filter(r => r.isActive) ?? []);
            setGrantedRewards(grantedRewardsResponse.data ?? []);
            // --- FIN CORRECCIÓN ---
            console.log('[useCustomerRewardsData] Rewards data fetch successful.');

        } catch (err) {
            // ... (manejo de errores sin cambios) ...
            console.error("[useCustomerRewardsData] Error fetching rewards data:", err);
             let errorMsg = 'Error al cargar recompensas o regalos.';
             if (err instanceof AxiosError) {
                 errorMsg = err.response?.data?.message || err.message || errorMsg;
             } else if (err instanceof Error) {
                 errorMsg = err.message;
             }
             setErrorRewards(errorMsg);
            setRewards([]);
            setGrantedRewards([]);
        } finally {
            setLoadingRewards(false);
            setLoadingGrantedRewards(false);
            console.log('[useCustomerRewardsData] Fetch rewards process finished.');
        }
    }, []);

    // Efecto para Carga Inicial (sin cambios)
    useEffect(() => {
        fetchRewardsData();
    }, [fetchRewardsData]);

    // --- Efecto para Combinar Recompensas y Regalos (ACTUALIZADO) ---
    useEffect(() => {
        console.log('[useCustomerRewardsData] Combining rewards and gifts...');
        // Mapear regalos a formato DisplayReward
        const gifts: DisplayReward[] = grantedRewards
            .filter(gr => gr.status === 'PENDING')
            .map(gr => {
                const assignerName = gr.assignedBy?.name || gr.assignedBy?.email || gr.business?.name || 'Admin';
                return {
                    isGift: true,
                    grantedRewardId: gr.id,
                    id: gr.reward.id,
                    name: gr.reward.name,
                    description: gr.reward.description,
                    pointsCost: 0,
                    imageUrl: gr.reward.imageUrl, // <-- CORREGIDO: Incluir imageUrl del regalo
                    assignedByString: assignerName,
                    assignedAt: gr.assignedAt
                };
            });

        // Mapear recompensas normales (ya filtradas por activas)
        const pointsRewards: DisplayReward[] = rewards.map(r => ({
            isGift: false,
            id: r.id,
            name: r.name,
            description: r.description,
            pointsCost: r.pointsCost,
            imageUrl: r.imageUrl, // <-- CORREGIDO: Incluir imageUrl de la recompensa
        }));

        // Combinar (regalos primero) y actualizar estado
        setDisplayRewards([...gifts, ...pointsRewards]);
        console.log('[useCustomerRewardsData] Display rewards updated.');
    }, [rewards, grantedRewards]); // Dependencias sin cambios

    // Retorno del Hook (sin cambios)
    return {
        displayRewards,
        loadingRewards,
        loadingGrantedRewards,
        errorRewards,
        refreshRewards: fetchRewardsData
    };
};

export default useCustomerRewardsData; // Asegúrate que el export default usa el nombre correcto

// End of File: frontend/src/hooks/useCustomerRewardsData.ts